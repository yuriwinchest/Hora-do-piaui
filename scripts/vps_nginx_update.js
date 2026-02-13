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

let ogUpstream = (process.env.OG_UPSTREAM || '').trim();
if (!ogUpstream) {
  console.error('Missing OG_UPSTREAM in .env (example: OG_UPSTREAM=http://127.0.0.1:<OG_PORT>).');
  process.exit(1);
}

// Keep .env simple (no trailing ';') and validate format early.
if (ogUpstream.endsWith(';')) ogUpstream = ogUpstream.slice(0, -1).trim();
if (!/^https?:\/\//i.test(ogUpstream)) {
  console.error('OG_UPSTREAM must start with http:// or https://');
  process.exit(1);
}
if (ogUpstream.endsWith('/')) {
  console.error('OG_UPSTREAM must not end with /');
  process.exit(1);
}

if (!privateKey) {
  console.error('Missing VPS_SSH_KEY_PATH (.env). This script only supports SSH key auth.');
  process.exit(1);
}

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }
    const localConf = path.resolve(__dirname, '../nginx_horapiaui.conf');
    const confTemplate = fs.readFileSync(localConf, 'utf8');
    const conf = confTemplate.replace(/<OG_UPSTREAM>/g, ogUpstream);
    const buf = Buffer.from(conf);

    sftp.writeFile('/tmp/nginx_horapiaui.conf', buf, { mode: 0o644 }, (err) => {
      if (err) { console.error('Upload config error:', err); conn.end(); return; }
      const cmd =
        'sudo cp /etc/nginx/conf.d/horapiaui.conf /etc/nginx/conf.d/horapiaui.conf.bak 2>/dev/null || true; ' +
        'sudo cp /etc/nginx/conf.d/horapiaui.com.conf /etc/nginx/conf.d/horapiaui.com.conf.bak 2>/dev/null || true; ' +
        'sudo cp /tmp/nginx_horapiaui.conf /etc/nginx/conf.d/horapiaui.conf; ' +
        'sudo nginx -t && sudo systemctl reload nginx && echo "Nginx reload OK"';

      conn.exec(cmd, (e, stream) => {
        if (e) { console.error(e); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', (code) => conn.end());
      });
    });
  });
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({
  host: process.env.VPS_HOST,
  username: process.env.VPS_USER,
  privateKey,
  passphrase,
  readyTimeout: 60000,
  keepaliveInterval: 5000,
  keepaliveCountMax: 10,
});
