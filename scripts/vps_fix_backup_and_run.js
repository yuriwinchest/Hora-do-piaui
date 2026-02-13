import { Client } from 'ssh2';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    if (!fs.existsSync(expanded)) return null;
    return fs.readFileSync(expanded, 'utf8');
  } catch {
    return null;
  }
}

const privateKey = loadSshPrivateKey();
const passphrase = process.env.VPS_SSH_KEY_PASSPHRASE || process.env.VPS_PRIVATE_KEY_PASSPHRASE || undefined;

if (!privateKey) {
  console.error('Missing VPS_SSH_KEY_PATH (.env). This script only supports SSH key auth.');
  process.exit(1);
}

const backupScript = fs.readFileSync(path.join(__dirname, '../docker/backup-supabase.sh'), 'utf8')
  .replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const envVars = `
export POSTGRES_HOST="${process.env.POSTGRES_HOST}"
export POSTGRES_USER="${process.env.POSTGRES_USER}"
export POSTGRES_PASSWORD="${process.env.POSTGRES_PASSWORD}"
export POSTGRES_DATABASE="${process.env.POSTGRES_DATABASE || 'postgres'}"
export BACKUP_DIR="/opt/horapiaui-backup/backups"
`;

const fullScript = '#!/bin/bash\n' + envVars + '\n' + backupScript;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }
    sftp.writeFile('/opt/horapiaui-backup/backup-supabase.sh', Buffer.from(fullScript, 'utf8'), { mode: 0o755 }, (e) => {
      if (e) { console.error(e); conn.end(); return; }
      conn.exec('cd /opt/horapiaui-backup && chmod +x backup-supabase.sh && ./backup-supabase.sh', (err2, stream) => {
        if (err2) { console.error(err2); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', code => { console.log('\nExit:', code); conn.end(); });
      });
    });
  });
}).connect({
  host: process.env.VPS_HOST,
  username: process.env.VPS_USER,
  privateKey,
  passphrase,
});
