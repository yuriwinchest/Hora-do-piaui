/**
 * Via SSH: cria .env em /var/www/horapiaui com vars do Supabase (do .env local)
 * e inicia o servidor OG (foto da matéria no WhatsApp) com pm2 ou nohup.
 * Usa: VPS_HOST, VPS_USER, VPS_PASSWORD, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY do .env
 */
import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

// IMPORTANTÍSSIMO:
// - VITE_SUPABASE_ANON_KEY na VPS deve ser SEMPRE a anon key real (para fallback funcionar)
// - SUPABASE_SERVICE_ROLE_KEY (se existir) fica separada
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || (!anonKey && !serviceRole)) {
  console.error(
    'Falta no .env: (VITE_SUPABASE_URL ou SUPABASE_URL) e pelo menos uma chave (VITE_SUPABASE_ANON_KEY e/ou SUPABASE_SERVICE_ROLE_KEY)'
  );
  process.exit(1);
}

// Valor para .env: se tiver newline ou aspas, envolver em aspas
function envLine(key, val) {
  const v = String(val).trim();
  if (v.includes('\n') || v.includes('"')) return `${key}="${v.replace(/"/g, '\\"')}"`;
  return `${key}=${v}`;
}

const envContent = `${envLine('VITE_SUPABASE_URL', supabaseUrl)}
${envLine('SUPABASE_URL', supabaseUrl)}
${anonKey ? envLine('VITE_SUPABASE_ANON_KEY', anonKey) + '\n' : ''}${serviceRole ? envLine('SUPABASE_SERVICE_ROLE_KEY', serviceRole) + '\n' : ''}DIST_PATH=/var/www/horapiaui
OG_PORT=3001
`;

const vpsHost = process.env.VPS_HOST || '';
const vpsPort = Number(process.env.VPS_PORT) || 22;
if (!vpsHost) {
  console.error('Falta VPS_HOST no .env (use o IP ou hostname da VPS, não localhost/Docker).');
  process.exit(1);
}
if (vpsHost === 'localhost' || vpsHost === '127.0.0.1' || vpsHost.startsWith('172.') || vpsHost.startsWith('192.168.')) {
  console.warn('Aviso: VPS_HOST parece ser local/Docker:', vpsHost, '- Para conectar na VPS use o IP ou hostname público do servidor.');
}
console.log('Conectando em', vpsHost + ':' + vpsPort, '...');

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

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }
    // 1) Escrever .env na VPS via SFTP (conteúdo exato, sem echo/base64)
    sftp.writeFile('/var/www/horapiaui/.env', envContent, { mode: 0o600 }, (errWrite) => {
      if (errWrite) {
        console.error('Write .env error:', errWrite);
        conn.end();
        return;
      }
      console.log('.env criado');
      // 2) Reiniciar servidor OG com pm2
      const cmd2 = `cd /var/www/horapiaui && (command -v pm2 >/dev/null 2>&1 && pm2 delete og-server 2>/dev/null; command -v pm2 >/dev/null 2>&1 && pm2 start server/og-server.js --name og-server --cwd /var/www/horapiaui || (nohup node server/og-server.js >> /var/log/og-server.log 2>&1 & echo "OG server started with nohup"))`;
      conn.exec(cmd2, (e2, stream2) => {
        if (e2) {
          console.error(e2);
          conn.end();
          return;
        }
        stream2.on('data', (d) => process.stdout.write(d));
        stream2.stderr.on('data', (d) => process.stderr.write(d));
        stream2.on('close', (code2) => {
          console.log(code2 === 0 ? 'OG server start command done.' : 'Check OG server on VPS.');
          conn.end();
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({
  host: vpsHost,
  port: vpsPort,
  username: process.env.VPS_USER,
  ...(privateKey ? { privateKey, passphrase } : { password: process.env.VPS_PASSWORD }),
  readyTimeout: 60000,
  keepaliveInterval: 5000,
});
