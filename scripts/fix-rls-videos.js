import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Client } = pg;

const client = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const sql = `
      -- Enable RLS for videos
      ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if any to avoid errors
      DROP POLICY IF EXISTS "Public videos are viewable by everyone." ON public.videos;
      DROP POLICY IF EXISTS "Users can insert videos." ON public.videos;
      DROP POLICY IF EXISTS "Users can update videos." ON public.videos;
      DROP POLICY IF EXISTS "Users can delete videos." ON public.videos;
      
      -- Generic drop attempts for common names
      DROP POLICY IF EXISTS "Enable read access for all users" ON public.videos;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.videos;
      DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.videos;

      -- Create Policies for Videos
      CREATE POLICY "Public videos are viewable by everyone." 
      ON public.videos FOR SELECT 
      USING (true);

      CREATE POLICY "Users can insert videos." 
      ON public.videos FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');

      CREATE POLICY "Users can update videos." 
      ON public.videos FOR UPDATE 
      USING (auth.role() = 'authenticated');

      CREATE POLICY "Users can delete videos." 
      ON public.videos FOR DELETE 
      USING (auth.role() = 'authenticated');


      -- Enable RLS for news (safety check)
      ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Public news are viewable by everyone." ON public.news;
      DROP POLICY IF EXISTS "Users can insert news." ON public.news;
      DROP POLICY IF EXISTS "Users can update news." ON public.news;
      DROP POLICY IF EXISTS "Users can delete news." ON public.news;

      CREATE POLICY "Public news are viewable by everyone." ON public.news FOR SELECT USING (true);
      CREATE POLICY "Users can insert news." ON public.news FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Users can update news." ON public.news FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Users can delete news." ON public.news FOR DELETE USING (auth.role() = 'authenticated');
    `;

        await client.query(sql);
        console.log('RLS policies applied successfully for videos and news.');

    } catch (err) {
        console.error('Error applying RLS:', err);
    } finally {
        await client.end();
    }
}

run();
