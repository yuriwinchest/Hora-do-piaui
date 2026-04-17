/**
 * Roda a migration que garante SELECT em horapiaui_news para anon.
 * Usa .env: POSTGRES_HOST, POSTGRES_PASSWORD (ou POSTGRES_USER)
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connStr = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${encodeURIComponent(process.env.POSTGRES_PASSWORD || '')}@${process.env.POSTGRES_HOST}:5432/postgres?sslmode=require`;

async function run() {
  const pg = (await import('pg')).default;
  const client = new pg.Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    console.log('Connected to database');
    const sqlPath = path.resolve(__dirname, '../supabase/migrations/20250131_ensure_horapiaui_news_read.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('Migration 20250131_ensure_horapiaui_news_read executed.');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
run();
