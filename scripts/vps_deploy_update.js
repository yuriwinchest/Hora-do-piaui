import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const conn = new Client();

function loadSshPrivateKey() {
  const rawPath =
    process.env.VPS_SSH_KEY_PATH ||
    process.env.VPS_PRIVATE_KEY_PATH ||
    '';

  if (!rawPath) return null;

  const expanded =
    rawPath.startsWith('~/') || rawPath === '~'
      ? path.join(os.homedir(), rawPath.slice(1))
      : rawPath;

  try {
    if (!fs.existsSync(expanded)) {
      console.warn('VPS_SSH_KEY_PATH not found:', expanded);
      return null;
    }
    return fs.readFileSync(expanded, 'utf8');
  } catch (e) {
    console.warn('Failed to read VPS SSH private key:', e?.message || e);
    return null;
  }
}

const privateKey = loadSshPrivateKey();
const passphrase = process.env.VPS_SSH_KEY_PASSPHRASE || process.env.VPS_PRIVATE_KEY_PASSPHRASE || undefined;

if (!privateKey) {
  console.error('Missing VPS_SSH_KEY_PATH (.env). This script only supports SSH key auth.');
  process.exit(1);
}

const vpsConfig = {
  host: process.env.VPS_HOST,
  username: process.env.VPS_USER,
  privateKey,
  passphrase,
  readyTimeout: 60000,
  keepaliveInterval: 5000,
  keepaliveCountMax: 10,
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
          const localServer = path.resolve(__dirname, '../server');
          if (fs.existsSync(localServer)) {
            return uploadDir(sftp, localServer, REMOTE_PATH + '/server').then(() => {
              console.log('Server OG enviado.');
            });
          }
          return Promise.resolve();
        }).then(() => {
          console.log('Upload complete.');
          // Reiniciar og-server para ler o novo index.html
          console.log('Restarting og-server...');
          return new Promise((resolve, reject) => {
            conn.exec('pm2 restart og-server 2>&1', (err, stream) => {
              if (err) { console.warn('PM2 restart warning:', err.message); return resolve(); }
              let out = '';
              stream.on('data', (d) => out += d.toString());
              stream.on('close', () => {
                console.log('og-server restarted.');
                resolve();
              });
            });
          });
        }).then(() => {
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
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect(vpsConfig);
