
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error("Connection string não encontrada.");
    process.exit(1);
}

const client = new Client({ connectionString });

async function diagnose() {
    await client.connect();
    console.log('--- DIAGNÓSTICO DO BANCO DE DADOS ---');

    try {
        // 1. Recarregar Schema Cache do Supabase (Importante!)
        console.log('\nTentando recarregar cache do Schema do Supabase...');
        await client.query("NOTIFY pgrst, 'reload config';");
        console.log('Comando de reload enviado.');

        // 2. Listar Tabelas
        const resTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('\nTabelas encontradas no schema public:', resTables.rows.map(r => r.table_name));

        // 3. Verificar colunas de horapiaui_news
        const resColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'horapiaui_news'
        `);
        console.log('\nColunas em horapiaui_news:');
        resColumns.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

        const hasUrgent = resColumns.rows.some(c => c.column_name === 'is_urgent');
        if (hasUrgent) {
            console.log('\n✅ Coluna is_urgent EXISTE.');
        } else {
            console.log('\n❌ Coluna is_urgent NÃO EXISTE.');
            
            // Tentativa de correção automática se não existir
            console.log('Tentando criar coluna is_urgent...');
            await client.query(`ALTER TABLE public.horapiaui_news ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;`);
            console.log('Coluna criada.');
        }

    } catch (err) {
        console.error('Erro no diagnóstico:', err);
    } finally {
        await client.end();
    }
}

diagnose();
