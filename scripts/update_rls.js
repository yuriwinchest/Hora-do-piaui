
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const client = new pg.Client({ connectionString });

async function run() {
    await client.connect();
    try {
        console.log('Updating RLS policies for horapiaui_ tables...');

        await client.query(`
            -- horapiaui_news
            ALTER TABLE IF EXISTS public.horapiaui_news ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Public Read" ON public.horapiaui_news;
            CREATE POLICY "Public Read" ON public.horapiaui_news FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Auth Write" ON public.horapiaui_news;
            CREATE POLICY "Auth Write" ON public.horapiaui_news FOR ALL USING (auth.role() = 'authenticated');

            -- horapiaui_videos
            ALTER TABLE IF EXISTS public.horapiaui_videos ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Public Read" ON public.horapiaui_videos;
            CREATE POLICY "Public Read" ON public.horapiaui_videos FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Auth Write" ON public.horapiaui_videos;
            CREATE POLICY "Auth Write" ON public.horapiaui_videos FOR ALL USING (auth.role() = 'authenticated');

            -- horapiaui_home_layout
            ALTER TABLE IF EXISTS public.horapiaui_home_layout ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Public Read" ON public.horapiaui_home_layout;
            CREATE POLICY "Public Read" ON public.horapiaui_home_layout FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Auth Write" ON public.horapiaui_home_layout;
            CREATE POLICY "Auth Write" ON public.horapiaui_home_layout FOR ALL USING (auth.role() = 'authenticated');

            -- horapiaui_profiles
            ALTER TABLE IF EXISTS public.horapiaui_profiles ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Public Read" ON public.horapiaui_profiles;
            CREATE POLICY "Public Read" ON public.horapiaui_profiles FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Auth Update Own" ON public.horapiaui_profiles;
            CREATE POLICY "Auth Update Own" ON public.horapiaui_profiles FOR UPDATE USING (auth.uid() = id);
        `);

        console.log('RLS policies updated.');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
