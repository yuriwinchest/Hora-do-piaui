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
  'echo "=== Configurações Nginx ==="',
  'ls -la /etc/nginx/conf.d/',
  'echo ""',
  'echo "=== Configuração horapiaui ==="',
  'cat /etc/nginx/conf.d/horapiaui.conf 2>/dev/null || cat /etc/nginx/nginx_horapiaui.conf 2>/dev/null || echo "Config não encontrada em conf.d"',
  'echo ""',
  'echo "=== Testando com domínio ==="',
  'curl -H "Host: horapiaui.com" http://localhost 2>/dev/null | grep -o "<title>.*</title>" || echo "Título não encontrado"',
  'echo ""',
  'echo "=== Testando URL direta ==="',
  'curl -I http://horapiaui.com 2>&1 | head -5'
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
