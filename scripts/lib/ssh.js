import { Client } from 'ssh2';
import fs from 'fs';
import os from 'os';
import path from 'path';

export function loadSshPrivateKeyFromEnv(env) {
  const rawPath = env.VPS_SSH_KEY_PATH || env.VPS_PRIVATE_KEY_PATH || '';
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

export async function connectSsh(env) {
  const privateKey = loadSshPrivateKeyFromEnv(env);
  const passphrase = env.VPS_SSH_KEY_PASSPHRASE || env.VPS_PRIVATE_KEY_PASSPHRASE || undefined;

  if (!privateKey) {
    throw new Error('Missing VPS_SSH_KEY_PATH (.env). This project uses SSH key auth only.');
  }
  if (!env.VPS_HOST || !env.VPS_USER) {
    throw new Error('Missing VPS_HOST/VPS_USER in .env.');
  }

  return await new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => resolve(conn));
    conn.on('error', reject);
    conn.connect({
      host: env.VPS_HOST,
      username: env.VPS_USER,
      privateKey,
      passphrase,
      readyTimeout: 60000,
      keepaliveInterval: 5000,
      keepaliveCountMax: 10,
    });
  });
}

export async function exec(conn, cmd) {
  return await new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('data', (d) => (out += d.toString()));
      stream.stderr?.on('data', (d) => (errOut += d.toString()));
      stream.on('close', (code) => {
        if (code !== 0) {
          const e = new Error(`Remote command failed (exit ${code}): ${cmd}\n${errOut || out}`);
          return reject(e);
        }
        resolve(out);
      });
    });
  });
}

export async function sftp(conn) {
  return await new Promise((resolve, reject) => {
    conn.sftp((err, s) => {
      if (err) return reject(err);
      resolve(s);
    });
  });
}

