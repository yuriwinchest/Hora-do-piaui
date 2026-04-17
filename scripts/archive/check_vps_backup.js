import { Client } from 'ssh2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';
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
  readyTimeout: 60000,
  keepaliveInterval: 5000,
  keepaliveCountMax: 10,
};

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  // Check backups directory and images directory
  // Also check if docker container is running
  const cmd = `
    echo "=== CHECKING DOCKER CONTAINERS ==="
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep horapiaui
    
    echo ""
    echo "=== CHECKING SQL BACKUPS (/opt/horapiaui-backup/backups) ==="
    ls -lh /opt/horapiaui-backup/backups | head -n 10
    
    echo ""
    echo "=== CHECKING IMAGES (/opt/horapiaui-backup/images) ==="
    echo "Total images:"
    ls -1 /opt/horapiaui-backup/images | wc -l
    echo "First 5 images:"
    ls -lh /opt/horapiaui-backup/images | head -n 5
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(vpsConfig);
