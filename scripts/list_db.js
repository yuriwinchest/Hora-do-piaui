import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connStr = `postgres://postgres:${encodeURIComponent(process.env.POSTGRES_PASSWORD || '')}@${process.env.POSTGRES_HOST}:5432/postgres?sslmode=require`;

const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  
  const db = await client.query('SELECT current_database() as db');
  console.log('Banco:', db.rows[0].db);

  const tables = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('public', 'storage', 'auth') 
    AND table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name
  `);
  
  console.log('\nTabelas:');
  tables.rows.forEach(r => console.log('  -', r.table_schema + '.' + r.table_name));

  await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
