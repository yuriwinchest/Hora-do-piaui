
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, fullName, role, bio } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return res.status(500).json({ error: 'Server misconfiguration: Missing Supabase keys' });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // 1. Create User in Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Create Profile in horapiaui_profiles
        const { error: profileError } = await supabase
            .from('horapiaui_profiles')
            .upsert({
                id: userId,
                email,
                full_name: fullName,
                role: role || 'Jornalista',
                bio: bio || '',
                avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
            });

        if (profileError) {
            // Clean up auth user if profile fails? 
            // Ideally yes, but rare. Logging for now.
            console.error('Error creating profile:', profileError);
            return res.status(500).json({ error: 'User created but profile failed: ' + profileError.message });
        }

        return res.status(200).json({ user: authData.user, message: 'User created successfully' });

    } catch (err) {
        console.error('Create user error:', err);
        return res.status(500).json({ error: err.message });
    }
}
