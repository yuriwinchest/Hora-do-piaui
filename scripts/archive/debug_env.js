import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const keys = Object.keys(process.env).filter(k => 
  k.includes('URL') || 
  k.includes('DB') || 
  k.includes('POSTGRES') || 
  k.includes('SUPABASE') ||
  k.includes('VITE')
);

console.log('Available Env Keys:', keys);
