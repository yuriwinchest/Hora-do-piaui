/**
 * Completa setup: corrige script backup (LF) e executa + agenda cron
 * Usa retry e uma única conexão
 */
import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCKER_PATH = '/opt/horapiaui-backup';

function connect() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('error', reject);
    conn.on('ready', () => resolve(conn));
    conn.connect({
      host: process.env.VPS_HOST,
      port: 22,
      username: process.env.VPS_USER,
      password: process.env.VPS_PASSWORD,
      readyTimeout: 30000
    });
  });
}

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d.toString(); process.stdout.write(d); });
      stream.stderr?.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}`));
        else resolve(out);
      });
    });
  });
}

async function run() {
  let conn;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`\nTentativa ${attempt}/3 - Conectando à VPS...`);
      conn = await connect();
      console.log('Conectado.\n');
      break;
    } catch (e) {
      console.error('Falha:', e.message);
      if (attempt < 3) {
        console.log('Aguardando 5s antes de tentar novamente...');
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        throw e;
      }
    }
  }

  try {
    const backupScript = fs.readFileSync(path.join(__dirname, '../docker/backup-supabase.sh'), 'utf8')
      .replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const envVars = `
export POSTGRES_HOST="${process.env.POSTGRES_HOST}"
export POSTGRES_USER="${process.env.POSTGRES_USER}"
export POSTGRES_PASSWORD="${process.env.POSTGRES_PASSWORD}"
export POSTGRES_DATABASE="${process.env.POSTGRES_DATABASE || 'postgres'}"
export BACKUP_DIR="${DOCKER_PATH}/backups"
export SUPABASE_URL="${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}"
export SUPABASE_SERVICE_ROLE_KEY="${process.env.SUPABASE_SERVICE_ROLE_KEY}"
export IMAGES_DIR="${DOCKER_PATH}/images"
`;
    const fullScript = '#!/bin/bash\n' + envVars + '\n' + backupScript;

    console.log('=== Criando diretorios ===');
    await exec(conn, `mkdir -p ${DOCKER_PATH}/scripts ${DOCKER_PATH}/images`);

    console.log('=== Enviando scripts ===');
    const storageScript = fs.readFileSync(path.join(__dirname, 'backup-storage-standalone.js'), 'utf8')
      .replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    await new Promise((res, rej) => {
      conn.sftp((err, sftp) => {
        if (err) return rej(err);
        sftp.writeFile(`${DOCKER_PATH}/backup-supabase.sh`, Buffer.from(fullScript, 'utf8'), { mode: 0o755 }, (e) => {
          if (e) return rej(e);
          sftp.writeFile(`${DOCKER_PATH}/scripts/backup-storage-standalone.js`, Buffer.from(storageScript, 'utf8'), (e2) => (e2 ? rej(e2) : res()));
        });
      });
    });

    console.log('\n=== Executando backup do Supabase ===');
    await exec(conn, `cd ${DOCKER_PATH} && chmod +x backup-supabase.sh && ./backup-supabase.sh`);

    console.log('\n=== Verificando backups ===');
    await exec(conn, `ls -la ${DOCKER_PATH}/backups/`);
    console.log('\n=== Verificando imagens ===');
    await exec(conn, `ls -la ${DOCKER_PATH}/images/ 2>/dev/null || echo "Nenhuma imagem ainda"`);

    console.log('\n=== Configurando cron (diário às 3h) ===');
    const cronLine = `0 3 * * * cd ${DOCKER_PATH} && ./backup-supabase.sh >> /var/log/horapiaui-backup.log 2>&1`;
    await exec(conn, `(crontab -l 2>/dev/null | grep -v horapiaui-backup; echo "${cronLine}") | crontab -`);
    await exec(conn, 'crontab -l');

    console.log('\n=== Concluído ===');
  } finally {
    conn.end();
  }
}

run().catch((e) => {
  console.error('Erro:', e.message);
  process.exit(1);
});
