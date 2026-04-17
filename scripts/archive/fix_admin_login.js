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

async function fixAndCreateUser() {
  console.log('--- Fixing Admin User ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1. Delete orphaned profile to prevent conflict
    console.log('Deleting existing orphaned profile...');
    await client.query(`DELETE FROM public.horapiaui_profiles WHERE email = $1`, [EMAIL]);

    // 2. Create User via Auth API
    console.log('Creating Auth User...');
    const { data, error } = await adminClient.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'admin' }
    });

    if (error) {
        console.error('Error creating user:', error.message);
        throw error;
    }

    const userId = data.user.id;
    console.log(`User created (ID: ${userId}).`);

    // 3. Ensure Profile Exists and is Admin
    // (If trigger didn't create it, or if we need to force update)
    console.log('Ensuring Admin Role...');
    
    // Upsert profile
    await client.query(`
        INSERT INTO public.horapiaui_profiles (id, email, role, name)
        VALUES ($1, $2, 'admin', 'Admin Hora Piauí')
        ON CONFLICT (id) DO UPDATE 
        SET role = 'admin', email = $2;
    `, [userId, EMAIL]);

    console.log('Success! Admin user ready.');

  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await client.end();
  }
}

fixAndCreateUser();
