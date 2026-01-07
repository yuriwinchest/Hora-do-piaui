
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error("Connection string não encontrada no .env");
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
    console.log('Conectado ao banco de dados.');

    const sqlPath = path.join(__dirname, '../db_schema_banners.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Lendo SQL de:', sqlPath);
    console.log('Executando migração...');
    
    await client.query(sql);
    console.log('Tabela horapiaui_banners criada/verificada com sucesso!');

  } catch (err) {
    console.error('Erro durante a migração:', err);
  } finally {
    await client.end();
  }
}

runMigration();
