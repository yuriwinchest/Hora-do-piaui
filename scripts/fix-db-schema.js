
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('No connection string found');
    process.exit(1);
}

const client = new pg.Client({
    connectionString,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database');

        // 1. Fix Profiles Table Structure
        console.log('Fixing profiles table structure...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
              full_name text,
              avatar_url text,
              bio text,
              email text,
              updated_at timestamp with time zone,
              created_at timestamp with time zone DEFAULT now()
            );
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
            ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;
        `);

        // 2. Fix Trigger
        console.log('Updating trigger...');
        await client.query(`
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS trigger AS $$
            BEGIN
              INSERT INTO public.profiles (id, email, full_name, avatar_url)
              VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'avatar_url');
              RETURN new;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);

        // 3. Update Admin Profile
        console.log('Upserting admin profile...');
        const bioText = 'Diretor do Hora Piauí, o jornalista já atuou como comentarista político da TV Meio Norte, com passagem como correspondente em Brasília. Também apresentou o programa Grande Jornal Lupa1 e foi editor-geral do portal Central Piauí. Soma mais de 10 anos de experiência em assessoria política e na coordenação de campanhas eleitorais.';

        await client.query(`
            INSERT INTO public.profiles (id, email, full_name, bio, avatar_url)
            SELECT id, email, 'Redação Hora do Piauí', $1, 'https://ui-avatars.com/api/?name=MW&background=random'
            FROM auth.users WHERE email = 'horapiaui@gmail.com'
            ON CONFLICT (id) DO UPDATE
            SET 
                full_name = EXCLUDED.full_name,
                bio = EXCLUDED.bio,
                avatar_url = EXCLUDED.avatar_url;
        `, [bioText]);

        console.log('Database fixes applied successfully.');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
