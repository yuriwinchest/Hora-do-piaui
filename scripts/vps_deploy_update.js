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

// Nginx ativo usa root /var/www/horapiaui (bind mount no container).
// Importante: nunca apagar `.env` remoto (segredo); deploy faz swap atomico do resto.
const REMOTE_PATH = '/var/www/horapiaui';

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

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

function execRemote(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('close', (code) => {
        if (code !== 0) return reject(new Error(`Remote command failed (code=${code}): ${cmd}\n${errOut || out}`));
        resolve(out);
      });
      stream.on('data', (d) => (out += d.toString()));
      stream.stderr.on('data', (d) => (errOut += d.toString()));
    });
  });
}

function prepareRemoteStaging(conn, stamp) {
  return new Promise((resolve, reject) => {
    const tmp = `${REMOTE_PATH}/.deploy_tmp_${stamp}`;
    conn.exec(`mkdir -p ${tmp}`, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', () => resolve(tmp));
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  });
}

conn.on('ready', () => {
  console.log('Client :: ready');
  const stamp = nowStamp();
  prepareRemoteStaging(conn, stamp)
    .then((tmpPath) => {
      conn.sftp((err, sftp) => {
        if (err) throw err;

        const localDist = path.resolve(__dirname, '../dist');
        const localServer = path.resolve(__dirname, '../server');
        if (!fs.existsSync(localDist)) throw new Error('Local dist/ missing. Run build first.');

        console.log(`Uploading dist -> ${tmpPath} ...`);
        uploadDir(sftp, localDist, tmpPath)
          .then(() => {
            if (fs.existsSync(localServer)) {
              console.log(`Uploading server -> ${tmpPath}/server ...`);
              return uploadDir(sftp, localServer, `${tmpPath}/server`);
            }
            return Promise.resolve();
          })
          .then(async () => {
            console.log('Upload complete. Performing atomic swap on VPS...');

            // Swap everything except `.env` to avoid "arquivo zumbi" (old hashed assets).
            // Keep the root directory intact (bind mount stays valid).
            const swapCmd = `set -e
cd ${REMOTE_PATH}
test -f .env || (echo "Missing ${REMOTE_PATH}/.env (will not proceed)" 1>&2; exit 2)
cp -a .env .env.bak.${stamp} || true
# Ensure Node treats server/*.js as ESM (the OG container runs node server/og-server.mjs).
if [ ! -f package.json ]; then
  cat > package.json <<'JSON'
{"name":"horapiaui-site","private":true,"type":"module"}
JSON
fi
old=".old_${stamp}"
tmp=".deploy_tmp_${stamp}"
rm -rf "$old"
mkdir -p "$old"
for p in assets 22.png favicon.png favicon.svg index.html manifest.json server; do
  if [ -e "$p" ]; then mv "$p" "$old/$p"; fi
done
for p in assets 22.png favicon.png favicon.svg index.html manifest.json server; do
  if [ -e "$tmp/$p" ]; then mv "$tmp/$p" "$p"; fi
done
rm -rf "$tmp"
rm -rf "$old"
`;

            await execRemote(conn, swapCmd);

            // Restart services to avoid serving stale code/assets.
            // Prefer Docker containers if they exist; fallback to pm2 (legacy).
            const restartCmd = `set -e
if command -v docker >/dev/null 2>&1; then
  if docker ps --format '{{.Names}}' | grep -qx 'horapiaui-og'; then docker restart horapiaui-og >/dev/null; fi
  if docker ps --format '{{.Names}}' | grep -qx 'horapiaui-frontend'; then docker restart horapiaui-frontend >/dev/null; fi
fi
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart og-server >/dev/null 2>&1 || true
fi
echo "DEPLOY_OK"
`;
            await execRemote(conn, restartCmd);

            console.log('Deploy OK on VPS.');
            conn.end();
          })
          .catch((e) => {
            console.error('Deploy error:', e?.message || e);
            conn.end();
          });
      });
    })
    .catch((err) => {
      console.error('Prepare remote error:', err?.message || err);
      conn.end();
    });
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect(vpsConfig);
