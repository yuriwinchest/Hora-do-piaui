import { Client } from 'ssh2';
import dotenv from 'dotenv';

dotenv.config();

const conn = new Client();
conn.on('ready', () => {
  conn.exec('ls -la /var/www/horapiaui/ && echo "---" && ls -la /var/www/horapiaui/assets/', (err, stream) => {
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
