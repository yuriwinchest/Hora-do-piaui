import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import pg from 'pg';

dotenv.config();

const RESTORE_FILE_PATH = path.resolve('temp_restore.sql');

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

// Supabase details
const dbConfig = {
  host: 'db.mkfkiefwltdepgheynco.supabase.co', // Direct host
  port: 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: { rejectUnauthorized: false }
};

console.log('--- STARTING RESTORE PROCESS ---');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH :: Connected');

    // 1. Find latest backup file
    conn.exec('ls -t /opt/horapiaui-backup/backups/*.sql | head -n 1', (err, stream) => {
        if (err) throw err;
        let remoteFilePath = '';
        stream.on('data', (d) => { remoteFilePath += d.toString().trim(); });
        stream.on('close', (code) => {
            if (!remoteFilePath) {
                console.error('No backup file found on VPS.');
                conn.end();
                return;
            }
            console.log(`Latest backup found: ${remoteFilePath}`);

            // 2. Download file
            conn.sftp((err, sftp) => {
                if (err) throw err;
                console.log('Downloading backup file...');
                sftp.fastGet(remoteFilePath, RESTORE_FILE_PATH, (err) => {
                    if (err) {
                        console.error('Download failed:', err);
                        conn.end();
                        return;
                    }
                    console.log('Download complete:', RESTORE_FILE_PATH);
                    conn.end();
                    
                    // 3. Restore to Supabase
                    restoreToSupabase();
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('SSH Connection Error:', err);
}).connect(vpsConfig);


async function restoreToSupabase() {
    console.log('Connecting to Supabase Database...');
    const client = new pg.Pool(dbConfig); // Use Pool for better management, though Client is fine

    try {
        const sqlContent = fs.readFileSync(RESTORE_FILE_PATH, 'utf8');
        console.log(`Read SQL file (${(sqlContent.length / 1024 / 1024).toFixed(2)} MB). Executing...`);

        // We can't just run the whole file at once easily if it has complex COPY commands or multiple statements without splitting correctly.
        // However, pg-pool query method often handles multi-statement strings if they're standard SQL.
        // pg_dump plaintext usually works.
        // WARNING: huge dumps might OOM if loaded into string. 3MB is fine.
        
        await client.query(sqlContent);
        console.log('Successfully restored backup to Supabase!');

    } catch (err) {
        console.error('Error executing SQL on Supabase:', err);
    } finally {
        await client.end();
        // Cleanup
        try { fs.unlinkSync(RESTORE_FILE_PATH); } catch (e) {}
    }
}
