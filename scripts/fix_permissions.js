import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

async function fixPermissions() {
  console.log('--- Fixing Write Permissions (INSERT/UPDATE/DELETE) ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    
    const tables = [
      'horapiaui_news', 
      'horapiaui_videos', 
      'horapiaui_home_layout', 
      'horapiaui_banners', 
      'horapiaui_profiles',
      'advertising_banners'
    ];
    
    for (const table of tables) {
        console.log(`Configuring permissions for ${table}...`);
        
        // 1. Grant Permissions to Roles
        await client.query(`GRANT ALL ON public.${table} TO authenticated;`);
        await client.query(`GRANT ALL ON public.${table} TO service_role;`);
        
        // 2. Drop existing policies to prevent conflicts
        await client.query(`DROP POLICY IF EXISTS "Allow Insert" ON public.${table};`);
        await client.query(`DROP POLICY IF EXISTS "Allow Update" ON public.${table};`);
        await client.query(`DROP POLICY IF EXISTS "Allow Delete" ON public.${table};`);
        await client.query(`DROP POLICY IF EXISTS "Enable all for users" ON public.${table};`);
        await client.query(`DROP POLICY IF EXISTS "enable_all_access" ON public.${table};`);

        // 3. Create NEW policies for Admin/Authenticated Users
        
        // INSERT
        await client.query(`
            CREATE POLICY "Allow Insert"
            ON public.${table}
            FOR INSERT
            TO authenticated
            WITH CHECK (true);
        `);

        // UPDATE
        await client.query(`
            CREATE POLICY "Allow Update"
            ON public.${table}
            FOR UPDATE
            TO authenticated
            USING (true);
        `);

        // DELETE
        await client.query(`
            CREATE POLICY "Allow Delete"
            ON public.${table}
            FOR DELETE
            TO authenticated
            USING (true);
        `);
    }

    console.log('Permissions Fixed. Admins should be able to save now.');

  } catch (err) {
    console.error('Fix Failed:', err.message);
  } finally {
    await client.end();
  }
}

fixPermissions();
