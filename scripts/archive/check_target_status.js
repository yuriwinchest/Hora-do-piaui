import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const targetUrl = process.env.VITE_SUPABASE_URL; // mkf...
const targetKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // mkf... secret

console.log('Target URL:', targetUrl);

if (!targetUrl || !targetKey) {
    console.log('Missing Target Credentials in .env');
    process.exit(1);
}

const supabase = createClient(targetUrl, targetKey);

async function check() {
    const { count, error } = await supabase.from('horapiaui_news').select('*', { count: 'exact', head: true });
    if (error) {
        console.log('Target Check Error:', JSON.stringify(error));
    } else {
        console.log('Target Check OK. Rows in horapiaui_news:', count);
    }
}

check();
