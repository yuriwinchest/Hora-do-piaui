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
  'echo "=== Verificando arquivos atualizados ==="',
  'ls -lh /var/www/horapiaui/assets/ | grep index',
  'echo ""',
  'echo "=== Data/hora dos arquivos ==="',
  'stat /var/www/horapiaui/index.html | grep Modify',
  'echo ""',
  'echo "=== Testando site local ==="',
  'curl -s http://localhost | head -20',
  'echo ""',
  'echo "=== Status do Nginx ==="',
  'systemctl status nginx | head -10'
];

const commandString = commands.join(' && ');

conn.on('ready', () => {
  console.log('✅ Conectado à VPS');
  console.log('🔍 Verificando site...\n');

  conn.exec(commandString, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('close', () => {
      console.log('\n✅ Verificação concluída!');
      console.log('\n🌐 Acesse: http://horapiaui.com ou http://72.60.53.191');
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
