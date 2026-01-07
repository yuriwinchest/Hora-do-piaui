
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error("Connection string não encontrada no .env (POSTGRES_URL_NON_POOLING ou POSTGRES_URL)");
    process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados via pg.');

    const sql = `
      ALTER TABLE public.horapiaui_news ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
    `;
    
    console.log('Executando SQL:', sql);
    await client.query(sql);
    console.log('Migração executada com sucesso!');
    
    // Verificação rápida
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='horapiaui_news' AND column_name='is_urgent';
    `);
    
    if (res.rows.length > 0) {
        console.log('Confirmação: Coluna is_urgent encontrada no schema.');
    } else {
        console.error('ERRO: Coluna is_urgent NÃO encontrada após execução.');
    }

  } catch (err) {
    console.error('Erro durante a migração:', err);
  } finally {
    await client.end();
  }
}

runMigration();
