
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

async function fixPermissions() {
    await client.connect();
    console.log('--- CORREÇÃO DE PERMISSÕES E CACHE ---');

    try {
        // 1. Recarregar Schema Cache do Supabase (Mais uma vez)
        console.log('Recarregando cache do PostgREST...');
        await client.query("NOTIFY pgrst, 'reload config';");
        
        // 2. Garantir permissões para 'anon' e 'authenticated'
        console.log('Aplicando GRANTs...');
        
        // Permissões básicas
        await client.query(`GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;`);
        await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;`);
        await client.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`);
        await client.query(`GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;`);

        console.log('Permissões aplicadas com sucesso.');

        // 3. Verificar Policies
        const resRLS = await client.query(`SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'horapiaui_news'`);
        const rlsEnabled = resRLS.rows[0]?.relrowsecurity;
        console.log(`RLS em horapiaui_news está: ${rlsEnabled ? 'ATIVO' : 'DESATIVADO'}`);

        if (rlsEnabled) {
            console.log('RLS está ativo. Verificando policies...');
            // Se RLS estiver ativo, precisamos garantir que haja policies permissivas para este projeto de demonstração/teste
            // Ou podemos desativar RLS se o usuário quiser acesso total sem auth (parece ser o caso, app público de admin local)
            
            // Para garantir que funcione agora, vou criar uma policy permissiva se não existir
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE tablename = 'horapiaui_news' AND policyname = 'enable_all_access'
                    ) THEN
                        CREATE POLICY "enable_all_access" ON "public"."horapiaui_news"
                        AS PERMISSIVE FOR ALL
                        TO public
                        USING (true)
                        WITH CHECK (true);
                    END IF;
                END
                $$;
            `);
            console.log('Policy "enable_all_access" verificada/criada.');
        }

    } catch (err) {
        console.error('Erro ao corrigir permissões:', err);
    } finally {
        await client.end();
    }
}

fixPermissions();
