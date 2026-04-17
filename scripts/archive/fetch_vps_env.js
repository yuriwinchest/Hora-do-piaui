import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to VPS...');
  
  // Try to read .env from the project folder
  // Based on previous scripts, path seems to be /var/www/horapiaui
  const remotePath = '/var/www/horapiaui/.env';
  
  conn.exec(`cat ${remotePath}`, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    
    let content = '';
    
    stream.on('close', (code, signal) => {
      console.log('Stream closed');
      conn.end();
      if (content) {
        // Mask passwords before printing if needed, or just print keys to verify
        console.log('--- VPS .env Content (Filtered) ---');
        content.split('\n').forEach(line => {
             if(line.includes('URL') || line.includes('DB') || line.includes('KEY')) {
                 console.log(line);
             }
        });
      } else {
          console.log('File was empty or not found.');
      }
    }).on('data', (data) => {
      content += data;
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
