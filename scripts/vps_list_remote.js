import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';

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

const conn = new Client();
conn.on('ready', () => {
  conn.exec('ls -la /var/www/horapiaui/ && echo "---" && ls -la /var/www/horapiaui/assets/', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: process.env.VPS_HOST,
  username: process.env.VPS_USER,
  privateKey,
  passphrase,
});
