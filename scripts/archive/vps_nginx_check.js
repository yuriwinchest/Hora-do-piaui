import { Client } from 'ssh2';
import dotenv from 'dotenv';

dotenv.config();

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    echo "=== Sites enabled ==="
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
    echo ""
    echo "=== Main config includes ==="
    grep -E "include|server_name" /etc/nginx/nginx.conf 2>/dev/null | head -20
    echo ""
    echo "=== Config with horapiaui ==="
    grep -r "horapiaui" /etc/nginx/ 2>/dev/null || true
    echo ""
    echo "=== Root and cache in active configs ==="
    grep -r "root\|expires\|Cache-Control" /etc/nginx/sites-enabled/ 2>/dev/null || grep -r "root\|expires\|Cache-Control" /etc/nginx/conf.d/ 2>/dev/null || true
  `, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
