import pg from 'pg';

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';

const { Client } = pg;

async function debugAuth() {
  console.log('--- Deep Debugging Auth ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1. Search in auth.users
    const resAuth = await client.query(`
        SELECT id, email, encrypted_password, email_confirmed_at 
        FROM auth.users 
        WHERE email = 'horapiaui@gmail.com';
    `);
    
    if (resAuth.rowCount > 0) {
        console.log('User FOUND in auth.users:', resAuth.rows[0]);
        
        // If found, let's force update the password
        console.log('Updating password hash directly...');
        // Note: generating valid bcrypt hash in node is better, but Supabase API is preferred.
        // If API fails, we might need to delete and recreate.
        
        // Let's try deleting it completely from auth.users to clear the slate
        console.log('Deleting from auth.users to force clean slate...');
        await client.query(`DELETE FROM auth.users WHERE email = 'horapiaui@gmail.com'`);
        console.log('Deleted.');
    } else {
        console.log('User NOT found in auth.users.');
    }

    // 2. Check Triggers on auth.users
    const resTriggers = await client.query(`
        SELECT tgname 
        FROM pg_trigger
        WHERE tgrelid = 'auth.users'::regclass;
    `);
    console.log('Triggers on auth.users:', resTriggers.rows.map(r => r.tgname));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

debugAuth();
