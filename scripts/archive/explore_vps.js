import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected...');
  // Check running node processes to find cwd
  conn.exec('ps aux | grep node', (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => console.log('Processes:\n' + data));
  });
  
  // List /var/www
  conn.exec('ls -F /var/www/', (err, stream) => {
     stream.on('data', d => console.log('/var/www/:\n' + d));
  });

  setTimeout(() => conn.end(), 5000);
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
