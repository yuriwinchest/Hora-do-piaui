
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

const EMAIL = 'horapiaui@gmail.com';
const PASSWORD = 'Horadopiaui123';

async function updateAdmin() {
    console.log(`Checking user: ${EMAIL}...`);

    // 1. Get User by Email (Admin API)
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const user = users.find(u => u.email === EMAIL);

    if (user) {
        console.log(`User found (${user.id}). Updating password...`);
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            user.id,
            { password: PASSWORD }
        );

        if (updateError) {
            console.error('Error updating password:', updateError);
        } else {
            console.log('Password updated successfully to: Horadopiaui123');
        }
    } else {
        console.log('User not found. Creating user...');
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: EMAIL,
            password: PASSWORD,
            email_confirm: true
        });

        if (createError) {
            console.error('Error creating user:', createError);
        } else {
            console.log(`User created successfully: ${newUser.user.id}`);
            // Also ensure profile exists
            /*
            await adminClient.from('profiles').upsert({
                id: newUser.user.id,
                email: EMAIL,
                full_name: 'Admin Hora Piauí',
                role: 'admin'
            });
            */
        }
    }
}

updateAdmin();
