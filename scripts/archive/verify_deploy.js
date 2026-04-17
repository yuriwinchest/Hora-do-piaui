import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to VPS...');
  
  const cmd = 'grep -r "mkfkiefwltdepgheynco" /var/www/horapiaui/dist/assets';
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => console.log('Found New Project ID in assets:\n' + data));
    stream.stderr.on('data', (data) => console.log('STDERR: ' + data));
    stream.on('close', (code) => {
        if (code === 0) console.log('Verification: New Project ID IS present in the build.');
        else console.log('Verification: New Project ID NOT found (grep exit code ' + code + ')');
        conn.end();
    });
  });
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
