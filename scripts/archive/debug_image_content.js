import pg from 'pg';

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';

const { Client } = pg;

async function inspectImages() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    
    // Get 5 rows with their image URLs
    const res = await client.query(`SELECT id, title, image FROM public.horapiaui_news LIMIT 5`);
    
    console.log('--- Image URLs in DB ---');
    res.rows.forEach(r => {
        console.log(`Title: ${r.title.substring(0, 20)}...`);
        console.log(`Image: ${r.image}`);
        console.log('---');
    });

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspectImages();
