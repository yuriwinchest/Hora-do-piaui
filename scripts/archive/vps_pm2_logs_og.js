/**
 * Via SSH: mostra últimas linhas do pm2 logs og-server.
 * Uso: node scripts/vps_pm2_logs_og.js
 */
import { Client } from 'ssh2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const conn = new Client();
conn.on('ready', () => {
  // pm2 logs às vezes “trava” em modo tail; pegar direto os arquivos é determinístico
  const cmd = [
    'echo \"=== og-server ERROR (tail) ===\"',
    'tail -n 120 /root/.pm2/logs/og-server-error.log 2>/dev/null || echo \"(sem error.log)\"',
    'echo',
    'echo \"=== og-server OUT (tail) ===\"',
    'tail -n 80 /root/.pm2/logs/og-server-out.log 2>/dev/null || echo \"(sem out.log)\"',
  ].join(' && ');

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('data', (d) => { out += d; });
    stream.on('close', (code) => {
      console.log(out.trim() || '(nenhum log)');
      conn.end();
    });
  });
}).on('error', (e) => {
  console.error('SSH:', e.message);
  process.exit(1);
}).connect({
  host: process.env.VPS_HOST,
  port: Number(process.env.VPS_PORT) || 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD,
});
