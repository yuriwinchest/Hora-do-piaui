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

const USERS_TO_FIX = [
    { email: 'noely2002123@gmail.com', pass: 'Horapiaui@2026' }
];

async function restoreUsers() {
  console.log('--- Restoring User Access ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Remove trigger temporarily just in case
    await client.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);

    for (const u of USERS_TO_FIX) {
        console.log(`Processing: ${u.email}...`);
        
        // 1. Check if auth user exists
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const exists = users.find(existing => existing.email === u.email);
        
        if (exists) {
            console.log('  Auth user already exists. Updating password...');
            await adminClient.auth.admin.updateUserById(exists.id, { password: u.pass });
        } else {
            console.log('  Auth user missing. Creating...');
            const { data, error } = await adminClient.auth.admin.createUser({
                email: u.email,
                password: u.pass,
                email_confirm: true,
                user_metadata: { full_name: 'Noely Alvarenga' } // Try to keep name
            });
            
            if (error) {
                console.error(`  Error creating ${u.email}:`, error.message);
                continue;
            }
            
            // 2. Link existing profile to new Auth ID
            // The profile 'id' (uuid) must match the Auth User 'id'.
            // Since we just created a NEW auth user, it has a NEW ID.
            // We must update the old profile row to point to this new ID.
            
            const newId = data.user.id;
            console.log(`  New Auth ID: ${newId}. Linking old profile...`);
            
            // First, find the old profile ID
            const resOld = await client.query(`SELECT id FROM public.horapiaui_profiles WHERE email = $1`, [u.email]);
            
            if (resOld.rowCount > 0) {
                const oldId = resOld.rows[0].id;
                if (oldId !== newId) {
                    console.log(`  Updating profile ID from ${oldId} to ${newId}`);
                    // We need to update the ID. This can be tricky with FKs, but usually profiles is the child or standalone.
                    // If 'id' is PK, we can't just update it if there are dependencies?
                    // Let's try deleting old and inserting new (safest for profile) preserving data.
                    
                    // Backup data
                    const profileData = (await client.query(`SELECT * FROM public.horapiaui_profiles WHERE id = $1`, [oldId])).rows[0];
                    
                    // Delete old
                    await client.query(`DELETE FROM public.horapiaui_profiles WHERE id = $1`, [oldId]);
                    
                    // Insert new with same data but new ID
                    await client.query(`
                        INSERT INTO public.horapiaui_profiles (id, email, role, full_name, avatar_url, bio)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [newId, u.email, profileData.role, profileData.full_name, profileData.avatar_url, profileData.bio]);
                }
            } else {
                 // Profile didn't exist? Create one.
                 await client.query(`
                    INSERT INTO public.horapiaui_profiles (id, email, role, full_name)
                    VALUES ($1, $2, 'Jornalista', 'Noely Alvarenga')
                 `, [newId, u.email]);
            }
        }
    }

    console.log('--- Done ---');

  } catch (err) {
    console.error('Fatal Error:', err.message);
  } finally {
    await client.end();
  }
}

restoreUsers();
