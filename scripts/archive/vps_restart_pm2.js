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
  'echo "=== Reiniciando og-server ==="',
  'pm2 restart og-server',
  'echo ""',
  'echo "=== Status PM2 ==="',
  'pm2 list',
  'echo ""',
  'echo "=== Logs recentes ==="',
  'pm2 logs og-server --lines 10 --nostream'
];

const commandString = commands.join(' && ');

conn.on('ready', () => {
  console.log('✅ Conectado à VPS');
  console.log('🔄 Reiniciando servidor...\n');

  conn.exec(commandString, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('close', (code) => {
      console.log('\n✅ Servidor reiniciado!');
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
