
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const client = new pg.Client({ connectionString });

async function run() {
    await client.connect(); // Connect PG too
    try {
        const email = 'horapiaui@gmail.com';
        const password = 'HoraPiaui123';
        const fullName = 'Redação Hora do Piauí';

        console.log('Checking user:', email);

        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        let user = users.find(u => u.email === email);
        let userId;

        if (user) {
            console.log('User exists. Updating password...');
            userId = user.id;
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
                password: password,
                email_confirm: true,
                user_metadata: { full_name: fullName }
            });
            if (updateError) throw updateError;
            console.log('Password updated to:', password);
        } else {
            console.log('Creating user...');
            const { data, error: createError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: fullName }
            });
            if (createError) throw createError;
            userId = data.user.id;
            console.log('User created:', userId);
        }

        // Ensure profile exists in NEW table horapiaui_profiles
        // (Assuming rename_tables.js ran or will run, but this script assumes table is horapiaui_profiles? 
        // Or should I handle both? I'll assume rename runs first).

        console.log('Upserting profile...');
        // Try horapiaui_profiles first
        try {
            await client.query(`
                INSERT INTO public.horapiaui_profiles (id, email, full_name, bio, avatar_url)
                VALUES ($1, $2, $3, 'Administrador do sistema', 'https://ui-avatars.com/api/?name=HP&background=random')
                ON CONFLICT (id) DO UPDATE
                SET full_name = EXCLUDED.full_name;
            `, [userId, email, fullName]);
        } catch (err) {
            // Fallback to 'profiles' if rename didn't happen yet? 
            // Better to fail if table missing so I know order is wrong
            console.error('Error inserting profile (table rename check?):', err.message);
            throw err;
        }

        console.log('Auth fix complete.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

run();
