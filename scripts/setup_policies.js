
const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('POSTGRES_URL not found in .env');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function setupPolicies() {
    try {
        await client.connect();
        console.log('Connected to Postgres');

        const sql = `
      -- Create bucket if not exists (redundant but safe)
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('images', 'images', true)
      ON CONFLICT (id) DO NOTHING;

      -- Enable RLS (should be on by default but ensure)
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies to avoid conflicts
      DROP POLICY IF EXISTS "Public Access Select" ON storage.objects;
      DROP POLICY IF EXISTS "Public Access Insert" ON storage.objects;
      DROP POLICY IF EXISTS "Public Access Update" ON storage.objects;
      DROP POLICY IF EXISTS "Public Access Delete" ON storage.objects;

      -- Create permissive policies for 'images' bucket
      -- ALERT: This allows ANYONE with the Anon key to upload/delete in 'images'. 
      -- Given the user context, this is likley desired for simplicity now.
      
      CREATE POLICY "Public Access Select" ON storage.objects 
      FOR SELECT USING ( bucket_id = 'images' );

      CREATE POLICY "Public Access Insert" ON storage.objects 
      FOR INSERT WITH CHECK ( bucket_id = 'images' );

      CREATE POLICY "Public Access Update" ON storage.objects 
      FOR UPDATE USING ( bucket_id = 'images' );

      CREATE POLICY "Public Access Delete" ON storage.objects 
      FOR DELETE USING ( bucket_id = 'images' );
      
      COMMIT;
    `;

        await client.query(sql);
        console.log('Storage policies applied successfully for "images" bucket.');

    } catch (err) {
        console.error('Error applying policies:', err);
    } finally {
        await client.end();
    }
}

setupPolicies();
