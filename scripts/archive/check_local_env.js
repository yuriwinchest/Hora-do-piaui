import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Local VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('Local POSTGRES_URL:', process.env.POSTGRES_URL ? 'Set (Hidden)' : 'Not Set');
console.log('Local POSTGRES_HOST:', process.env.POSTGRES_HOST);
