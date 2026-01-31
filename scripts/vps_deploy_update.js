import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const conn = new Client();

const vpsConfig = {
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
};

// Nginx ativo usa root /var/www/horapiaui (não /dist!)
const REMOTE_PATH = '/var/www/horapiaui';

function uploadDir(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.mkdir(remotePath, (err) => {
      // Ignore if directory already exists
      const files = fs.readdirSync(localPath);
      let count = files.length;
      if (count === 0) return resolve();

      files.forEach(file => {
        const fullLocalPath = path.join(localPath, file);
        const fullRemotePath = remotePath + '/' + file;

        if (fs.statSync(fullLocalPath).isDirectory()) {
          uploadDir(sftp, fullLocalPath, fullRemotePath).then(() => {
            if (--count === 0) resolve();
          }).catch(reject);
        } else {
          console.log(`Uploading ${file}...`);
          sftp.fastPut(fullLocalPath, fullRemotePath, (err) => {
            if (err) reject(err);
            if (--count === 0) resolve();
          });
        }
      });
    });
  });
}

function cleanRemoteDist(conn) {
  return new Promise((resolve, reject) => {
    // Limpa conteúdo de /var/www/horapiaui (onde nginx aponta)
    conn.exec(`rm -rf ${REMOTE_PATH}/*`, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => {
        if (code !== 0) {
          console.warn('Clean remote warning (code:', code, ')');
        } else {
          console.log('Remote dist cleaned.');
        }
        resolve();
      });
      stream.on('data', (d) => process.stdout.write(d));
    });
  });
}

conn.on('ready', () => {
  console.log('Client :: ready');
  cleanRemoteDist(conn).then(() => {
    conn.sftp((err, sftp) => {
      if (err) throw err;
      const localDist = path.resolve(__dirname, '../dist');
      console.log(`Uploading from ${localDist} to ${REMOTE_PATH}...`);
      
      sftp.mkdir(REMOTE_PATH, { mode: '0755' }, (err) => {
        uploadDir(sftp, localDist, REMOTE_PATH).then(() => {
          console.log('Upload complete.');
          conn.end();
        }).catch(err => {
          console.error('Upload error:', err);
          conn.end();
        });
      });
    });
  }).catch(err => {
    console.error('Clean remote error:', err);
    conn.end();
  });
}).connect(vpsConfig);
