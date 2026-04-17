import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

dotenv.config();

function loadSshPrivateKey() {
  const rawPath =
    process.env.VPS_SSH_KEY_PATH ||
    process.env.VPS_PRIVATE_KEY_PATH ||
    '';

  if (!rawPath) return null;

  const expanded =
    rawPath.startsWith('~/') || rawPath === '~'
      ? path.join(os.homedir(), rawPath.slice(1))
      : rawPath;

  try {
    if (!fs.existsSync(expanded)) {
      console.warn('VPS_SSH_KEY_PATH not found:', expanded);
      return null;
    }
    return fs.readFileSync(expanded, 'utf8');
  } catch (e) {
    console.warn('Failed to read VPS SSH private key:', e?.message || e);
    return null;
  }
}

const privateKey = loadSshPrivateKey();
const passphrase = process.env.VPS_SSH_KEY_PASSPHRASE || process.env.VPS_PRIVATE_KEY_PASSPHRASE || undefined;

const vpsConfig = {
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  ...(privateKey ? { privateKey, passphrase } : { password: process.env.VPS_PASSWORD }),
};

const NODE_SCRIPT = `
const fs = require('fs');
const { Client } = require('pg');

const config = {
  // Use IPv4 Pooler
  host: 'aws-0-us-east-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.mkfkiefwltdepgheynco',
  password: '${process.env.POSTGRES_PASSWORD}',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

async function run() {
  console.log(\`Connecting to pooler: \${config.host}:\${config.port}...\`);
  
  const client = new Client(config);
  try {
    await client.connect();
    console.log('Connected to Supabase!');
    
    // Find latest backup file
    const backups = fs.readdirSync('/backups').filter(f => f.endsWith('.sql'));
    if (backups.length === 0) {
      console.error('No backups found in /backups');
      process.exit(1);
    }
    // Sort descending by name (works for timestamped names)
    backups.sort().reverse();
    const latest = backups[0];
    const latestPath = '/backups/' + latest;
    
    console.log(\`Latest backup: \${latestPath}\`);
    
    const sql = fs.readFileSync(latestPath, 'utf8');
    console.log(\`Running SQL (~ \${Math.round(sql.length / 1024)} KB)...\`);
    
    // Split by semicolons for better feedback? No, pg runs entire string typically.
    // If huge, split? 3MB is fine.
    
    await client.query(sql);
    
    console.log('Restore successfully completed!');
    
  } catch (err) {
    console.error('RESTORE ERROR:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
`;

const VPS_SCRIPT_PATH = '/opt/horapiaui-backup/scripts/restore_node_oneoff.js';

console.log('--- UPLOADING RESTORE SCRIPT TO VPS ---');
const conn = new Client();
conn.on('ready', () => {
    console.log('SSH :: Connected');
    
    // write script
    conn.exec(`cat > ${VPS_SCRIPT_PATH} <<EOF
${NODE_SCRIPT.replace(/\$/g, '\\$')} 
EOF
    `, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            if (code !== 0) {
                console.error('Failed to write script to VPS');
                conn.end();
                return;
            }
            
            console.log('Script uploaded. Running via Docker Node...');
            
            // Run Node script inside container
            // We need to install pg first
            const dockerCmd = `
                echo "Installing dependencies..."
                docker run --rm \
                -v /opt/horapiaui-backup/backups:/backups \
                -v /opt/horapiaui-backup/scripts:/scripts \
                node:20-alpine \
                sh -c "cd /scripts && npm install pg --no-audit --no-fund --silent && node restore_node_oneoff.js"
            `;
            
            conn.exec(dockerCmd, (err2, stream2) => {
                if (err2) throw err2;
                stream2.on('close', (code2, signal2) => {
                    console.log('Docker run finished with code: ' + code2);
                    conn.end();
                }).on('data', (d) => process.stdout.write('VPS: ' + d)).stderr.on('data', (d) => process.stderr.write('VPS ERR: ' + d));
            });
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect(vpsConfig);
