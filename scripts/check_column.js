import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  (() => {
    const host = String(process.env.POSTGRES_HOST || '').trim();
    const pass = String(process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '').trim();
    if (!host || !pass) return '';
    return `postgres://postgres:${encodeURIComponent(pass)}@${host}:5432/postgres?sslmode=require`;
  })();

if (!connectionString) {
  console.error('Missing DB connection env. Set POSTGRES_URL_NON_POOLING (recommended) or POSTGRES_HOST + POSTGRES_PASSWORD.');
  process.exit(1);
}

const { Client } = pg;

async function checkColumns() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    
    const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'horapiaui_news';
    `);

    console.log('Columns in horapiaui_news:', res.rows.map(r => r.column_name).join(', '));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkColumns();
