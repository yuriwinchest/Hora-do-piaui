import { Client } from 'ssh2';
import dotenv from 'dotenv';

dotenv.config();

const conn = new Client();

const vpsConfig = {
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
};

const commands = [
  'echo "=== Estrutura de diretórios ==="',
  'ls -la /var/www/',
  'echo ""',
  'echo "=== Conteúdo de /var/www/horapiaui ==="',
  'ls -la /var/www/horapiaui/',
  'echo ""',
  'echo "=== Verificando se é repositório git ==="',
  'if [ -d "/var/www/horapiaui/.git" ]; then echo "É um repositório git"; else echo "NÃO é um repositório git"; fi',
  'echo ""',
  'echo "=== Procurando por repositórios git ==="',
  'find /root -name ".git" -type d 2>/dev/null || echo "Nenhum encontrado em /root"',
  'echo ""',
  'echo "=== PM2 status ==="',
  'pm2 list',
  'echo ""',
  'echo "=== Nginx sites habilitados ==="',
  'ls -la /etc/nginx/sites-enabled/',
  'echo ""',
  'echo "=== Configuração nginx horapiaui ==="',
  'cat /etc/nginx/sites-enabled/horapiaui 2>/dev/null || cat /etc/nginx/sites-available/horapiaui 2>/dev/null || echo "Config não encontrada"'
];

const commandString = commands.join(' && ');

conn.on('ready', () => {
  console.log('✅ Conectado à VPS\n');

  conn.exec(commandString, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('close', () => {
      conn.end();
    });

    stream.on('data', (data) => {
      process.stdout.write(data.toString());
    });

    stream.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('❌ Erro de conexão:', err.message);
  process.exit(1);
}).connect(vpsConfig);
