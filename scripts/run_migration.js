import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Direct DB connection (Supabase recommends for migrations/DDL)
const connStr = `postgres://postgres:${encodeURIComponent(process.env.POSTGRES_PASSWORD || '')}@${process.env.POSTGRES_HOST}:5432/postgres?sslmode=require`;

const client = new pg.Client({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    const sqlPath = path.resolve(__dirname, '../supabase/migrations/20250131_increment_news_views_and_storage.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('Migration executed successfully');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
run();
