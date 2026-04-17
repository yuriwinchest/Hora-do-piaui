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

async function setupAdmin() {
  console.log('--- Configuring Admin & Tables ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1. Promote horapiaui@gmail.com to Admin
    console.log('Promoting horapiaui@gmail.com...');
    await client.query(`
        UPDATE public.horapiaui_profiles
        SET role = 'admin'
        WHERE email = 'horapiaui@gmail.com';
    `);

    // 2. Ensure Admin Tables Exist
    const tables = [
        `CREATE TABLE IF NOT EXISTS public.horapiaui_banners (
          id uuid default gen_random_uuid() primary key,
          title text default '',
          video_url text default '',
          alignment text default 'left',
          is_active boolean default true,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          updated_at timestamp with time zone default timezone('utc'::text, now()) not null
        )`,
        `CREATE TABLE IF NOT EXISTS public.advertising_banners (
          id uuid default gen_random_uuid() primary key,
          image_url text not null,
          link_url text,
          display_order integer default 0,
          is_active boolean default true,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null
        )`
    ];

    for (const sql of tables) {
        await client.query(sql);
    }
    console.log('Admin Tables Verified.');
    
    // 3. Fix Permissions just in case
    await client.query(`GRANT ALL ON public.horapiaui_profiles TO service_role;`);
    await client.query(`GRANT ALL ON public.horapiaui_banners TO service_role;`);
    await client.query(`GRANT ALL ON public.advertising_banners TO service_role;`);

  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}

setupAdmin();
