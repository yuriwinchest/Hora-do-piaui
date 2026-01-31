/**
 * Instala Docker na VPS e configura backup do banco Supabase
 * Executa via SSH: instala Docker, cria estrutura, sobe PostgreSQL
 */
import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const conn = new Client();
const DOCKER_PATH = '/opt/horapiaui-backup';

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

conn.on('ready', async () => {
  try {
    console.log('\n=== 1. Instalando Docker (imagem oficial) ===');
    await exec(conn, `
      set -e
      if ! command -v docker &>/dev/null; then
        echo "Instalando Docker do repositório oficial..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm -f get-docker.sh
        systemctl enable docker
        systemctl start docker
      fi
      docker --version
      echo "Docker instalado."
    `);

    console.log('\n=== 2. Criando diretório ===');
    await exec(conn, `mkdir -p ${DOCKER_PATH}/backups ${DOCKER_PATH}/init`);

    console.log('\n=== 3. Enviando docker-compose e scripts ===');
    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      const dockerCompose = fs.readFileSync(path.join(__dirname, '../docker/docker-compose.yml'), 'utf8');
      const backupScript = fs.readFileSync(path.join(__dirname, '../docker/backup-supabase.sh'), 'utf8');

      // Enviar docker-compose e .env (credenciais locais - nunca commitar)
      const localPgPassword = process.env.LOCAL_PG_PASSWORD || process.env.LOCAL_PG_PASS;
      const envContent = localPgPassword ? `LOCAL_PG_USER=backup\nLOCAL_PG_PASSWORD=${localPgPassword}\n` : '# Adicione LOCAL_PG_PASSWORD\n';
      await new Promise((res, rej) => {
        sftp.writeFile(`${DOCKER_PATH}/docker-compose.yml`, Buffer.from(dockerCompose), (e) =>
          e ? rej(e) : sftp.writeFile(`${DOCKER_PATH}/.env`, Buffer.from(envContent), (e2) => (e2 ? rej(e2) : res()))
        );
      });

      // Enviar script de backup com variáveis do .env
      const envVars = `# Variáveis do banco Supabase
export POSTGRES_HOST="${process.env.POSTGRES_HOST}"
export POSTGRES_USER="${process.env.POSTGRES_USER}"
export POSTGRES_PASSWORD="${process.env.POSTGRES_PASSWORD}"
export POSTGRES_DATABASE="${process.env.POSTGRES_DATABASE || 'postgres'}"
export BACKUP_DIR="${DOCKER_PATH}/backups"

`;
      const fullBackupScript = ('#!/bin/bash\n' + envVars + backupScript).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      await new Promise((res, rej) => {
        sftp.writeFile(`${DOCKER_PATH}/backup-supabase.sh`, Buffer.from(fullBackupScript, 'utf8'), { mode: 0o755 }, (e) => e ? rej(e) : res());
      });

      await exec(conn, `chmod +x ${DOCKER_PATH}/backup-supabase.sh`);

      console.log('\n=== 4. Baixando imagem oficial PostgreSQL e subindo container ===');
      await exec(conn, `cd ${DOCKER_PATH} && (docker compose pull || docker-compose pull) && (docker compose up -d || docker-compose up -d)`);

      console.log('\n=== 5. Executando primeiro backup ===');
      await exec(conn, `cd ${DOCKER_PATH} && ./backup-supabase.sh`);

      console.log('\n=== Concluído ===');
      console.log(`Backups em: ${DOCKER_PATH}/backups`);
      console.log('Para backup manual: ssh root@VPS "cd /opt/horapiaui-backup && ./backup-supabase.sh"');
      console.log('Para agendar (cron diário às 3h):');
      console.log('  0 3 * * * cd /opt/horapiaui-backup && ./backup-supabase.sh');

      conn.end();
    });
  } catch (e) {
    console.error('Erro:', e.message);
    conn.end();
    process.exit(1);
  }
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
