import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mkfkiefwltdepgheynco.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

const EMAIL = 'horapiaui@gmail.com';
const NEW_PASSWORD = 'Horapiaui@2026';

async function resetPassword() {
    console.log(`Searching for user: ${EMAIL}...`);

    // List users to find the ID
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const user = users.find(u => u.email === EMAIL);

    if (user) {
        console.log(`User found (ID: ${user.id}). Updating password...`);
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            user.id,
            { password: NEW_PASSWORD, email_confirm: true }
        );

        if (updateError) {
            console.error('Error updating password:', updateError);
        } else {
            console.log(`Password for ${EMAIL} successfully updated to: ${NEW_PASSWORD}`);
        }
    } else {
        console.log('User not found. Creating new admin user...');
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: EMAIL,
            password: NEW_PASSWORD,
            email_confirm: true,
            user_metadata: { role: 'admin' }
        });

        if (createError) {
            console.error('Error creating user:', createError);
        } else {
            console.log(`User created successfully (ID: ${newUser.user.id}). Password set.`);
            
            // Also ensure entry in profiles table via SQL triggers usually, 
            // but we can try to insert if triggers fail or don't exist
            // (Assuming horapiaui_profiles is linked via id)
        }
    }
}

resetPassword();
