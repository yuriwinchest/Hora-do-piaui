import pg from 'pg';

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';

const { Client } = pg;

async function fixSchema() {
  console.log('Fixing Schema on mkfkiefwltdepgheynco...');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    
    // 1. Add 'featured' column
    console.log("Adding 'featured' column...");
    await client.query(`
        ALTER TABLE public.horapiaui_news 
        ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
    `);

    // 2. Add 'status' column (just in case, though debug showed it exists)
    await client.query(`
        ALTER TABLE public.horapiaui_news 
        ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
    `);

    // 3. Mark the latest news as featured
    console.log("Setting latest news as Featured...");
    await client.query(`
        UPDATE public.horapiaui_news
        SET featured = true
        WHERE id = (
            SELECT id FROM public.horapiaui_news 
            ORDER BY created_at DESC 
            LIMIT 1
        );
    `);
    
    // 4. Update existing rows to have a valid status if null
    await client.query(`
        UPDATE public.horapiaui_news
        SET status = 'published'
        WHERE status IS NULL;
    `);

    console.log('Schema Fixed & Data Updated.');

  } catch (err) {
    console.error('Fix Failed:', err.message);
  } finally {
    await client.end();
  }
}

fixSchema();
