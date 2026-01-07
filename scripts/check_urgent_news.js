
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error("Connection string não encontrada.");
    process.exit(1);
}

const client = new Client({ connectionString });

async function check() {
    await client.connect();
    try {
        console.log('Buscando notícias com is_urgent = true...');
        const res = await client.query(`
            SELECT id, title, is_urgent 
            FROM horapiaui_news 
            WHERE is_urgent = true
        `);
        
        console.log(`Encontradas ${res.rows.length} notícias urgentes.`);
        res.rows.forEach(r => console.log(` - [${r.id}] ${r.title}`));

        if (res.rows.length === 0) {
            console.log('Nenhuma notícia urgente encontrada. Verifique se o update realmente funcionou.');
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

check();
