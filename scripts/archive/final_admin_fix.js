import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mkfkiefwltdepgheynco.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const { Client } = pg;
const adminClient = createClient(supabaseUrl, serviceRoleKey);

const EMAIL = 'horapiaui@gmail.com';
const PASSWORD = 'Horapiaui@2026';

async function fixTriggerAndCreate() {
  console.log('--- Fixing Trigger & Creating Admin ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1. Drop the bad trigger
    console.log('Dropping problematic trigger "on_auth_user_created"...');
    await client.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
    
    // Also drop the function it calls, to be clean (optional, but good)
    // Need to find function name first, usually handle_new_user
    await client.query(`DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;`);


    // 2. Create Auth User
    console.log('Creating Auth User (Admin API)...');
    const { data, error } = await adminClient.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'admin' }
    });

    if (error) {
        throw error;
    }
    console.log(`User created! ID: ${data.user.id}`);

    // 3. Create Profile Manually (since trigger is gone)
    console.log('Creating Admin Profile...');
    await client.query(`
        INSERT INTO public.horapiaui_profiles (id, email, role, name)
        VALUES ($1, $2, 'admin', 'Admin Hora Piauí')
        ON CONFLICT (id) DO UPDATE 
        SET role = 'admin';
    `, [data.user.id, EMAIL]);

    // 4. Re-create Trigger (Corrected Version) - Optional but recommended for future signups
    console.log('Restoring corrected trigger...');
    await client.query(`
        create or replace function public.handle_new_user() 
        returns trigger as $$
        begin
          insert into public.horapiaui_profiles (id, email, role, name)
          values (new.id, new.email, 'Jornalista', new.raw_user_meta_data->>'full_name');
          return new;
        end;
        $$ language plpgsql security definer;

        create trigger on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_new_user();
    `);

    console.log('Done! Admin access restored.');

  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await client.end();
  }
}

fixTriggerAndCreate();
