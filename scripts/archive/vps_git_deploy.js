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

// O repositório pode estar em /root/Hora-do-piaui ou /var/www/horapiaui
// Vamos tentar encontrar onde está
const commands = [
  'echo "=== Procurando repositório Git ==="',
  'if [ -d "/root/Hora-do-piaui/.git" ]; then cd /root/Hora-do-piaui; elif [ -d "/var/www/horapiaui/.git" ]; then cd /var/www/horapiaui; else echo "Repositório não encontrado"; exit 1; fi',
  'echo "=== Diretório atual ==="',
  'pwd',
  'echo "=== Git Pull ==="',
  'git pull origin main',
  'echo "=== Instalando dependências ==="',
  'npm install',
  'echo "=== Building projeto ==="',
  'npm run build',
  'echo "=== Verificando PM2 ==="',
  'pm2 list',
  'echo "=== Reiniciando PM2 (se houver) ==="',
  'pm2 restart all || echo "PM2 não está rodando"',
  'echo "=== Deploy concluído! ==="'
];

const commandString = commands.join(' && ');

conn.on('ready', () => {
  console.log('✅ Conectado à VPS');
  console.log('🚀 Iniciando deploy...\n');

  conn.exec(commandString, (err, stream) => {
    if (err) {
      console.error('❌ Erro ao executar comando:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('close', (code, signal) => {
      console.log('\n');
      if (code === 0) {
        console.log('✅ Deploy concluído com sucesso!');
      } else {
        console.log(`❌ Deploy falhou com código: ${code}`);
      }
      conn.end();
      process.exit(code);
    });

    stream.on('data', (data) => {
      process.stdout.write(data.toString());
    });

    stream.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('❌ Erro de conexão SSH:', err.message);
  process.exit(1);
}).connect(vpsConfig);
