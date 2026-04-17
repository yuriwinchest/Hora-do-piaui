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

const cmd = `
    echo "=== PING Supabase Direct (db.mkfkiefwltdepgheynco.supabase.co) ==="
    ping -c 4 db.mkfkiefwltdepgheynco.supabase.co || echo "Ping failed"
    
    echo ""
    echo "=== PING Supabase Pooler (aws-0-us-east-2.pooler.supabase.com) ==="
    ping -c 4 aws-0-us-east-2.pooler.supabase.com || echo "Ping failed"
    
    echo ""
    echo "=== NETCAT Check Port 5432 (direct) ==="
    nc -zv db.mkfkiefwltdepgheynco.supabase.co 5432 && echo "Port 5432 OPEN" || echo "Port 5432 CLOSED"

    echo ""
    echo "=== NETCAT Check Port 6543 (pooler) ==="
    nc -zv aws-0-us-east-2.pooler.supabase.com 6543 && echo "Port 6543 OPEN" || echo "Port 6543 CLOSED"
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH :: Connected');
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect(vpsConfig);
