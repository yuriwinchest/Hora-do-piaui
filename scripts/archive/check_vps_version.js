import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const conn = new Client();

const OLD_ID = 'raxjzfvunjxqbxswuipp';
const NEW_ID = 'mkfkiefwltdepgheynco';

conn.on('ready', () => {
  console.log('--- Verifying Deployed Version on VPS ---');
  
  const cmd = `grep -r "supabase.co" /var/www/horapiaui/dist/assets | grep -o "https://[^\\"]*"`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    
    stream.on('data', (data) => {
        output += data.toString();
    });
    
    stream.on('close', () => {
        console.log('\nFound URLs in build:');
        const lines = output.split('\n').filter(Boolean);
        const unique = [...new Set(lines)];
        
        unique.forEach(url => {
            if (url.includes(OLD_ID)) console.log(`[OLD] ${url}`);
            else if (url.includes(NEW_ID)) console.log(`[NEW] ${url}`);
            else console.log(`[OTHER] ${url}`);
        });

        if (output.includes(NEW_ID) && !output.includes(OLD_ID)) {
            console.log('\nRESULT: The VPS is serving the NEW database.');
        } else if (output.includes(OLD_ID)) {
            console.log('\nRESULT: The VPS is serving the OLD database.');
        } else {
             console.log('\nRESULT: Could not determine definitively.');
        }
        conn.end();
    });
  });

}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
