
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Client } = pg;

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Connection string não encontrada no .env (POSTGRES_URL, DATABASE_URL, etc)");
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Conectado ao banco de dados via pg.');

        const sql = `
      ALTER TABLE public.horapiaui_news ADD COLUMN IF NOT EXISTS image_description TEXT;
    `;

        console.log('Executando SQL:', sql);
        await client.query(sql);
        console.log('Migração executada com sucesso!');

        // Verificação rápida
        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='horapiaui_news' AND column_name='image_description';
    `);

        if (res.rows.length > 0) {
            console.log('Confirmação: Coluna image_description encontrada no schema.');
        } else {
            console.error('ERRO: Coluna image_description NÃO encontrada após execução.');
        }

    } catch (err) {
        console.error('Erro durante a migração:', err);
    } finally {
        await client.end();
    }
}

runMigration();
