import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected. Searching for .env files...');
  
  // Find all .env files in /var/www
  conn.exec('find /var/www -maxdepth 3 -name ".env"', (err, stream) => {
    if (err) throw err;
    
    stream.on('data', (data) => {
        const paths = data.toString().trim().split('\n');
        console.log('Found files:', paths);
        
        // If files found, read them
        paths.forEach(p => {
            if (p) {
                console.log(`Reading ${p}...`);
                conn.exec(`cat ${p}`, (e, s) => {
                    s.on('data', d => console.log(`\n--- CONTENT OF ${p} ---\n` + d));
                });
            }
        });
    });
    
    stream.on('close', () => setTimeout(() => conn.end(), 5000));
  });

}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
