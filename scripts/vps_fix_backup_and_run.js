import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const backupScript = fs.readFileSync(path.join(__dirname, '../docker/backup-supabase.sh'), 'utf8')
  .replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const envVars = `
export POSTGRES_HOST="${process.env.POSTGRES_HOST}"
export POSTGRES_USER="${process.env.POSTGRES_USER}"
export POSTGRES_PASSWORD="${process.env.POSTGRES_PASSWORD}"
export POSTGRES_DATABASE="${process.env.POSTGRES_DATABASE || 'postgres'}"
export BACKUP_DIR="/opt/horapiaui-backup/backups"
`;

const fullScript = '#!/bin/bash\n' + envVars + '\n' + backupScript;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }
    sftp.writeFile('/opt/horapiaui-backup/backup-supabase.sh', Buffer.from(fullScript, 'utf8'), { mode: 0o755 }, (e) => {
      if (e) { console.error(e); conn.end(); return; }
      conn.exec('cd /opt/horapiaui-backup && chmod +x backup-supabase.sh && ./backup-supabase.sh', (err2, stream) => {
        if (err2) { console.error(err2); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', code => { console.log('\nExit:', code); conn.end(); });
      });
    });
  });
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
