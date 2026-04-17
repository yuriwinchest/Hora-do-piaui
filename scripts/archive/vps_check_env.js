import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const conn = new Client();

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('cat /var/www/fatopago/.env', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
