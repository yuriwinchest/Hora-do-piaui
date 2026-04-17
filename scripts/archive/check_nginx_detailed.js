import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const conn = new Client();

conn.on('ready', () => {
  console.log('--- Reading Nginx Config ---');
  
  conn.exec('cat /etc/nginx/sites-enabled/horapiaui', (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => {
        console.log(data.toString());
    });
    stream.stderr.on('data', (data) => {
        console.log('STDERR: ' + data);
    });
    stream.on('close', () => {
        conn.end();
    });
  });

}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
