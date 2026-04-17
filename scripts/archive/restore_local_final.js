import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import pg from 'pg';

dotenv.config();

const RESTORE_FILE_PATH = path.resolve('temp_restore_local.sql');

// Configuração SSH
function loadSshPrivateKey() {
  const rawPath = process.env.VPS_SSH_KEY_PATH || process.env.VPS_PRIVATE_KEY_PATH || '';
  if (!rawPath) return null;
  const expanded = rawPath.startsWith('~/') || rawPath === '~' ? path.join(os.homedir(), rawPath.slice(1)) : rawPath;
  try { return fs.existsSync(expanded) ? fs.readFileSync(expanded, 'utf8') : null; } catch { return null; }
}

const vpsConfig = {
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  ...(loadSshPrivateKey() ? { privateKey: loadSshPrivateKey(), passphrase: process.env.VPS_SSH_KEY_PASSPHRASE } : { password: process.env.VPS_PASSWORD }),
  readyTimeout: 60000
};

// Configuração Supabase (Pooler Connection String for best compatibility)
// Tentar conexão direta (sem pooler) para evitar erro de Tenant
const CONNECTION_STRING = "postgres://postgres:Fatopago%40202620@db.vnxbvsqpeeekiaqxmzzf.supabase.co:5432/postgres";

async function downloadBackup() {
    return new Promise((resolve, reject) => {
        console.log('1. Conectando VPS para baixar backup...');
        const conn = new Client();
        conn.on('ready', () => {
            console.log('   SSH Conectado.');
            conn.exec('ls -t /opt/horapiaui-backup/backups/horapiaui_*.sql | head -n 1', (err, stream) => {
                if (err) return reject(err);
                let remoteFile = '';
                stream.on('data', d => remoteFile += d.toString().trim());
                stream.on('close', () => {
                    if (!remoteFile) return reject('Nenhum backup encontrado no VPS');
                    console.log(`   Backup encontrado: ${remoteFile}`);
                    
                    conn.sftp((err, sftp) => {
                        if (err) return reject(err);
                        console.log('   Baixando arquivo (pode demorar um pouco)...');
                        sftp.fastGet(remoteFile, RESTORE_FILE_PATH, (err) => {
                            conn.end();
                            if (err) return reject(err);
                            console.log('   Download concluído!');
                            resolve(RESTORE_FILE_PATH);
                        });
                    });
                });
            });
        }).on('error', reject).connect(vpsConfig);
    });
}

async function restoreToSupabase() {
    console.log('2. Conectando ao Supabase (Via Pooler)...');
    
    const client = new pg.Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false } 
    });

    try {
        await client.connect();
        console.log('   Conectado ao Supabase!');

        let sql = fs.readFileSync(RESTORE_FILE_PATH, 'utf8');
        console.log(`   Lendo arquivo SQL (${(sql.length / 1024 / 1024).toFixed(2)} MB)...`);
        
        // Remove comandos específicos do psql que o client node-postgres não entende
        sql = sql.replace(/^\\connect.*$/gm, '-- removed connect')
                 .replace(/^\\set.*$/gm, '-- removed set')
                 .replace(/^\\.*$/gm, '-- removed backslash command');

        console.log('   Executando restauração... (aguarde)');
        await client.query(sql);
        
        console.log('✅ SUCESSO! Tabelas criadas e dados restaurados.');

    } catch (err) {
        console.error('❌ ERRO NA RESTAURAÇÃO:', err);
    } finally {
        await client.end();
        // Tenta limpar
        try { fs.unlinkSync(RESTORE_FILE_PATH); } catch {}
    }
}

async function main() {
    try {
        await downloadBackup();
        await restoreToSupabase();
    } catch (error) {
        console.error('Falha Geral:', error);
    }
}

main();
