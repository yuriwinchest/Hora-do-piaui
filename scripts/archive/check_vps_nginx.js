import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const conn = new Client();

const CONFIG = `
server {
    listen 80;
    server_name horapiaui.com www.horapiaui.com;
    
    root /var/www/horapiaui/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
`;

conn.on('ready', () => {
    console.log('Creating Nginx Config...');
    conn.exec(`echo '${CONFIG}' > /etc/nginx/sites-available/horapiaui`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Config created. Linking...');
            conn.exec('ln -sf /etc/nginx/sites-available/horapiaui /etc/nginx/sites-enabled/horapiaui', (e, s) => {
                s.on('close', () => {
                    console.log('Linked. Reloading Nginx...');
                    conn.exec('service nginx reload', (e2, s2) => { // Simpler command
                         console.log('Reload command sent.');
                         conn.end();
                    });
                });
            });
        });
    });
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});
