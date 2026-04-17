/**
 * Via SSH: faz curl em localhost:3000/noticia/SLUG na VPS e mostra se og:image é da matéria ou logo.
 * Uso: node scripts/vps_curl_og.js "cerimonia-no-palacio-de-karnak-celebra-despedida-e-boas-vindas-a-novos-gestores"
 */
import { Client } from 'ssh2';
import dotenv from 'dotenv';

dotenv.config();

const slug = process.argv[2] || 'cerimonia-no-palacio-de-karnak-celebra-despedida-e-boas-vindas-a-novos-gestores';

const conn = new Client();
conn.on('ready', () => {
  const cmd = `curl -sS -w "\\n--- HTTP %{http_code} ---" "http://127.0.0.1:3001/noticia/${slug}" | head -c 4000`;
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('data', (d) => { out += d; });
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => {
      console.log('OG server (localhost:3001) - primeiros 4000 chars:');
      console.log(out.trim() || '(vazio)');
      if (out.includes('og:image')) {
        const m = out.match(/og:image["']?\\s+content=["']([^"']+)/i);
        if (m) console.log('\n>>> og:image:', m[1].substring(0, 100) + (m[1].length > 100 ? '...' : ''));
      } else if (out.includes('502') || out.includes('Connection refused')) console.log('\n>>> Servidor OG pode estar parado ou Nginx caiu no fallback.');
      conn.end();
    });
  });
}).on('error', (e) => {
  console.error('SSH:', e.message);
  process.exit(1);
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
