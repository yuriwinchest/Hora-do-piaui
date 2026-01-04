import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Client } = pg;

const client = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const sql = `
      ALTER TABLE public.news 
      ADD COLUMN IF NOT EXISTS instagram_url text;
    `;

        await client.query(sql);
        console.log('Successfully added instagram_url column to news table.');

    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await client.end();
    }
}

run();
