import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const conn = new Client();

conn.on('ready', () => {
  console.log('Checking /etc/nginx structure...');
  conn.exec('ls -F /etc/nginx/', (err, stream) => {
      stream.on('data', d => console.log(d.toString()));
      stream.on('close', () => conn.end());
  });
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
