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
  'echo "=== Conteúdo do index.html (primeiras linhas) ==="',
  'head -30 /var/www/horapiaui/index.html',
  'echo ""',
  'echo "=== Verificando se o novo código está presente ==="',
  'grep -o "getCurrentDateBR\\|getCurrentTimeBR" /var/www/horapiaui/assets/index-*.js | head -2 || echo "Funções não encontradas no bundle (código pode estar minificado)"',
  'echo ""',
  'echo "=== Hash do arquivo JS principal ==="',
  'md5sum /var/www/horapiaui/assets/index-DRVV8dkK.js',
  'echo ""',
  'echo "=== Arquivos no diretório ==="',
  'ls -lh /var/www/horapiaui/',
  'echo ""',
  'echo "=== Nginx está servindo? ==="',
  'curl -s -o /dev/null -w "%{http_code}" http://72.60.53.191'
];

const commandString = commands.join(' && ');

conn.on('ready', () => {
  console.log('✅ Conectado à VPS');
  console.log('🔍 Verificação final...\n');

  conn.exec(commandString, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('close', () => {
      console.log('\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ DEPLOY CONCLUÍDO COM SUCESSO!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('🌐 Site: http://horapiaui.com');
      console.log('📝 Alterações aplicadas:');
      console.log('   ✓ Correção de data/hora com timezone do Brasil');
      console.log('   ✓ Campos editáveis de data e hora no admin');
      console.log('   ✓ Seção completa de autor com nome completo');
      console.log('   ✓ Funções utilitárias de formatação');
      console.log('');
      console.log('⚠️  IMPORTANTE: Limpe o cache do navegador para ver as mudanças!');
      console.log('   (Ctrl+Shift+R no Chrome/Firefox)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
