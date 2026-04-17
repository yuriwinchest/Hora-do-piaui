import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Client } = pg;

async function check() {
  const currentUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  
  console.log('--- Verificando Banco Atual (POSTGRES_URL) ---');
  if (!currentUrl) {
    console.log('POSTGRES_URL não configurado.');
    return;
  }

  const client = new Client({
    connectionString: currentUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Conectado ao Banco Atual.');

    // Check table existence
    const resTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'horapiaui_news'
    `);

    if (resTables.rowCount === 0) {
      console.log('Tabela "horapiaui_news" NÃO existe.');
      
      // Check for old table name 'news'
      const resOld = await client.query(`
          SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news'
      `);
      if (resOld.rowCount > 0) {
           const count = await client.query('SELECT count(*) as total FROM news');
           console.log(`Tabela antiga "news" encontrada. Total: ${count.rows[0].total}`);
      } else {
           console.log('Nenhuma tabela de notícias encontrada (banco vazio?).');
      }

    } else {
      const resCount = await client.query('SELECT count(*) as total FROM horapiaui_news');
      console.log(`Tabela "horapiaui_news" encontrada. Total de notícias: ${resCount.rows[0].total}`);
    }

  } catch (err) {
    console.error('Erro ao conectar:', err.message);
  } finally {
    await client.end();
  }
}

check();
