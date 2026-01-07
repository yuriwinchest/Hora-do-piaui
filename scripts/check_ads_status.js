
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAds() {
  try {
    await client.connect();
    console.log('Conectado ao DB.');

    // 1. Check Table Existence and Count
    const resTable = await client.query(`
      SELECT count(*) FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'advertising_banners'
    `);
    console.log('Tabela advertising_banners existe?', resTable.rows[0].count > 0);

    if (resTable.rows[0].count > 0) {
        const resCount = await client.query('SELECT count(*) FROM public.advertising_banners');
        console.log('Total de banners na tabela:', resCount.rows[0].count);

        const resRows = await client.query('SELECT * FROM public.advertising_banners ORDER BY created_at DESC LIMIT 5');
        console.log('Últimos 5 banners:', resRows.rows);
    }

    // 2. Check Storage Buckets
    const resBuckets = await client.query(`
        select id, name, public from storage.buckets where id = 'ads'
    `);
    console.log('Bucket "ads":', resBuckets.rows);

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}

checkAds();
