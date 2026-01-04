
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('No connection string');
    process.exit(1);
}

const client = new pg.Client({ connectionString });

async function run() {
    await client.connect();
    try {
        console.log('Renaming tables to prefix "horapiaui_"...');

        const tables = ['news', 'videos', 'home_layout', 'profiles'];

        for (const t of tables) {
            console.log(`Renaming ${t}...`);
            // Use DO block or try/catch in SQL? simpler to just run ALTER and ignore "does not exist" via node catch, 
            // but strict check is better.
            // Check if table exists
            const { rows } = await client.query(`SELECT to_regclass('public.${t}');`);
            if (rows[0].to_regclass) {
                await client.query(`ALTER TABLE public.${t} RENAME TO horapiaui_${t};`);
                console.log(`Renamed public.${t} -> public.horapiaui_${t}`);
            } else {
                console.log(`Table public.${t} not found (maybe already renamed).`);
            }
        }

        console.log('Updating handle_new_user trigger...');
        await client.query(`
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS trigger AS $$
            BEGIN
              INSERT INTO public.horapiaui_profiles (id, email, full_name, avatar_url)
              VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'avatar_url');
              RETURN new;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);

        console.log('Done.');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
