
require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
});

async function checkSlug() {
    await client.connect();
    try {
        const res = await client.query(`SELECT id, title, slug FROM horapiaui_news WHERE id = 'a30d7cf1-a6cf-4b3a-9dc2-d965ba63b51a'`);
        console.log('Item found:', res.rows[0]);
    } catch (err) {
        console.error('Error querying:', err);
    } finally {
        await client.end();
    }
}

checkSlug();
