import pg from 'pg';

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';

const { Client } = pg;

async function fixRLS() {
  console.log('Fixing RLS on mkfkiefwltdepgheynco...');
  
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
        console.log(`Configuring policies for ${table}...`);
        
        // 1. Grant Select Permission (Crucial!)
        await client.query(`GRANT SELECT ON public.${table} TO anon;`);
        await client.query(`GRANT SELECT ON public.${table} TO service_role;`);
        await client.query(`GRANT SELECT ON public.${table} TO authenticated;`);

        // 2. Enable RLS
        await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
        
        // 3. Drop existing policy to avoid conflict
        await client.query(`DROP POLICY IF EXISTS "Public Read Access" ON public.${table};`);
        await client.query(`DROP POLICY IF EXISTS "Anon Read" ON public.${table};`);
        await client.query(`DROP POLICY IF EXISTS "Allow Select" ON public.${table};`);
        
        // 4. Create Policy
        await client.query(`
            CREATE POLICY "Allow Select"
            ON public.${table}
            FOR SELECT
            TO public
            USING (true);
        `);
    }

    console.log('RLS Fixed. All public tables are now readable.');

  } catch (err) {
    console.error('RLS Fix Failed:', err.message);
  } finally {
    await client.end();
  }
}

fixRLS();
