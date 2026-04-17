/**
 * Envia apenas server/og-server.js para a VPS e reinicia o processo og-server (pm2).
 * Uso: node scripts/vps_upload_og_server.js
 */
import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const localFile = path.resolve(__dirname, '../server/og-server.js');
const remoteFile = '/var/www/horapiaui/server/og-server.js';

if (!fs.existsSync(localFile)) {
  console.error('Local file not found:', localFile);
  process.exit(1);
}

const vpsHost = process.env.VPS_HOST || '';
const vpsPort = Number(process.env.VPS_PORT) || 22;
if (!vpsHost) {
  console.error('Falta VPS_HOST no .env (use o IP ou hostname da VPS, não localhost/Docker).');
  process.exit(1);
}
if (vpsHost === 'localhost' || vpsHost === '127.0.0.1' || vpsHost.startsWith('172.') || vpsHost.startsWith('192.168.')) {
  console.warn('Aviso: VPS_HOST parece ser local/Docker:', vpsHost, '- Para conectar na VPS use o IP ou hostname público do servidor.');
}
console.log('Conectando em', vpsHost + ':' + vpsPort, '...');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }
    sftp.fastPut(localFile, remoteFile, (errPut) => {
      if (errPut) {
        console.error('Upload error:', errPut);
        conn.end();
        return;
      }
      console.log('og-server.js uploaded.');
      conn.exec('cd /var/www/horapiaui && (command -v pm2 >/dev/null && pm2 restart og-server || true)', (e, stream) => {
        if (e) {
          console.error(e);
          conn.end();
          return;
        }
        stream.on('data', (d) => process.stdout.write(d));
        stream.on('close', (code) => {
          console.log(code === 0 ? 'og-server restarted.' : 'Check pm2 on VPS.');
          conn.end();
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({
  host: vpsHost,
  port: vpsPort,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD,
  readyTimeout: 20000,
  keepaliveInterval: 5000,
});
