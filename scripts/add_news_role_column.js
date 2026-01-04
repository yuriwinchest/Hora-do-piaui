
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const client = new pg.Client({ connectionString });

async function run() {
    await client.connect();
    try {
        console.log('Adding "author_role" column to horapiaui_news...');

        await client.query(`
            ALTER TABLE IF EXISTS public.horapiaui_news 
            ADD COLUMN IF NOT EXISTS author_role text DEFAULT 'Jornalista';
        `);

        console.log('Column "author_role" added.');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
