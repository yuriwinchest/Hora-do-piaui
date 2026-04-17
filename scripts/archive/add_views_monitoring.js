
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    try {
        console.log('Adding "views" column to horapiaui_news...');

        await client.query(`
            ALTER TABLE IF EXISTS public.horapiaui_news 
            ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
        `);

        console.log('Column "views" added.');

        console.log('Creating increment_views function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION increment_news_views(news_id UUID)
            RETURNS VOID AS $$
            BEGIN
                UPDATE horapiaui_news
                SET views = COALESCE(views, 0) + 1
                WHERE id = news_id;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('Function "increment_news_views" created.');

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
