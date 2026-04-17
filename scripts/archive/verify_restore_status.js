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

// Use same config as restore
const PG_HOST = 'aws-0-us-east-2.pooler.supabase.com';
const PG_USER = 'postgres.mkfkiefwltdepgheynco';
const PG_PORT = 6543;
const PG_PASS = process.env.POSTGRES_PASSWORD;

const checkCmd = `
    docker run --rm \
      -e PGPASSWORD='${PG_PASS}' \
      postgres:17-alpine \
      psql \
      -h "${PG_HOST}" \
      -p ${PG_PORT} \
      -U "${PG_USER}" \
      -d postgres \
      -c "\\dt"
`;

console.log('--- CHECKING TABLES ON SUPABASE VIA VPS ---');
const conn = new Client();
conn.on('ready', () => {
    console.log('SSH :: Connected');
    conn.exec(checkCmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code);
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
