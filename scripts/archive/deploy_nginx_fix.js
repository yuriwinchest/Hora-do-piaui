import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const conn = new Client();
const localConfig = path.resolve(process.cwd(), 'nginx_horapiaui.conf');

conn.on('ready', () => {
  console.log('Connected. Uploading config...');
  
  conn.sftp((err, sftp) => {
      if (err) throw err;
      
      // 1. Upload to /tmp first (safe)
      sftp.fastPut(localConfig, '/tmp/horapiaui_nginx', (err) => {
          if (err) throw err;
          console.log('Uploaded to /tmp/horapiaui_nginx');
          
          // 2. Move to conf.d and Reload
          const cmd = `
            mv /tmp/horapiaui_nginx /etc/nginx/conf.d/horapiaui.conf && \
            nginx -t && \
            systemctl reload nginx
          `;
          
          console.log('Applying config to conf.d...');
          conn.exec(cmd, (err, stream) => {
              if (err) throw err;
              stream.on('data', d => console.log('STDOUT: ' + d));
              stream.stderr.on('data', d => console.log('STDERR: ' + d));
              stream.on('close', (code) => {
                  console.log(`Command finished with code ${code}`);
                  conn.end();
              });
          });
      });
  });
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
