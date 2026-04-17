process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';

const connectionString = 'postgres://postgres.mkfkiefwltdepgheynco:Fatopago%402026@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require';

const { Client } = pg;

async function check() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to mkfkiefwltdepgheynco');

    const tables = ['news', 'horapiaui_news', 'videos', 'horapiaui_videos', 'profiles', 'horapiaui_profiles'];
    
    for (const t of tables) {
        try {
            const res = await client.query(`SELECT count(*) as total FROM public.${t}`);
            console.log(`Table '${t}': ${res.rows[0].total} rows`);
        } catch (e) {
            console.log(`Table '${t}': Not found or Error (${e.message.split('\n')[0]})`);
        }
    }

  } catch (err) {
    console.error('Connection Error:', err.message);
  } finally {
    await client.end();
  }
}

check();
