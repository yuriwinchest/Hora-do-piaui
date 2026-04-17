import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const conn = new Client();
const REMOTE_DIST = '/var/www/horapiaui/dist';

conn.on('ready', () => {
  console.log('Connected to VPS.');

  // 1. Clean Remote Dist
  console.log('Cleaning remote dist folder...');
  conn.exec(`rm -rf ${REMOTE_DIST}/*`, (err, stream) => {
      stream.on('close', () => {
          console.log('Remote cleaned.');
          
          // 2. Upload New Dist
          conn.sftp((err, sftp) => {
              if (err) throw err;
              const localDist = path.resolve(process.cwd(), 'dist');
              console.log('Uploading new build...');
              uploadDir(sftp, localDist, REMOTE_DIST).then(() => {
                  console.log('Upload complete.');
                  
                  // 3. Restart Nginx to clear server cache
                  conn.exec('service nginx restart', (e, s) => {
                      console.log('Nginx restarted.');
                      conn.end();
                  });
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

function uploadDir(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
      // 1. Create remote dir
      sftp.mkdir(remotePath, { mode: '0755' }, (err) => {
        // ignore error if exists
        
        // 2. Read local
        const files = fs.readdirSync(localPath);
        let count = files.length;
        if (count === 0) return resolve();
  
        console.log(`Uploading ${count} files to ${remotePath}...`);
  
        files.forEach(file => {
          const fullLocal = path.join(localPath, file);
          const fullRemote = remotePath + '/' + file;
          
          if (fs.statSync(fullLocal).isDirectory()) {
              uploadDir(sftp, fullLocal, fullRemote).then(() => {
                  if (--count === 0) resolve();
              }).catch(reject);
          } else {
              sftp.fastPut(fullLocal, fullRemote, (err) => {
                  if (err) {
                      console.error(`Failed to upload ${file}: ${err.message}`);
                      reject(err);
                  } else {
                      // console.log(`Uploaded ${file}`);
                      if (--count === 0) resolve();
                  }
              });
          }
        });
      });
    });
  }
