import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';
const { Client } = pg;

async function fixRPCv2() {
  console.log('--- Fixing Missing RPC Function V2 ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1. Inspect table
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'horapiaui_site_stats';
    `);
    
    console.log('Columns:', res.rows.map(r => r.column_name));
    
    // 2. Drop and Recreate Function using correct columns
    console.log('Updating function...');
    
    // Usually columns are: id, visits_count OR id, visits
    // I'll handle both cases dynamically or just standardize.
    // Let's standardized to what was likely created before: id (text), visits_count (bigint)
    // BUT the error said: column "visits" does not exist.
    
    // Let's create a robust function that checks columns or just use the one we found.
    const hasVisitsCount = res.rows.some(r => r.column_name === 'visits_count');
    const colName = hasVisitsCount ? 'visits_count' : 'visits';
    
    await client.query(`
        CREATE OR REPLACE FUNCTION public.increment_site_visits()
        RETURNS void AS $$
        BEGIN
            UPDATE public.horapiaui_site_stats
            SET ${colName} = COALESCE(${colName}, 0) + 1
            WHERE id = 'main' OR id = '1' OR id = 1; 
            -- Covering bases for ID type (int or text)
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log('Function Fixed.');

  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}

fixRPCv2();
