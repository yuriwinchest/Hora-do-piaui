import pg from 'pg';

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';

const { Client } = pg;

async function checkAdminTables() {
  console.log('--- Checking Admin & Auth Tables ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    
    // 1. Check tables existence
    const tables = ['horapiaui_profiles', 'profiles', 'users'];
    for (const t of tables) {
        const res = await client.query(`
            SELECT to_regclass('public.${t}') as exists;
        `);
        console.log(`Table '${t}': ${res.rows[0].exists ? 'EXISTS' : 'MISSING'}`);
    }

    // 2. Check if profiles has 'role' column (Crucial for Admin)
    const resRole = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'horapiaui_profiles' AND column_name = 'role';
    `);
    console.log(`Column 'role' in horapiaui_profiles: ${resRole.rowCount > 0 ? 'EXISTS' : 'MISSING'}`);

    // 3. List users/admins
    // Note: auth.users is protected, we usually check public.profiles/horapiaui_profiles
    const resAdmins = await client.query(`
        SELECT * FROM public.horapiaui_profiles;
    `);
    console.log(`\nRegistered Profiles: ${resAdmins.rowCount}`);
    resAdmins.rows.forEach(r => {
        console.log(`- ${r.email} (Role: ${r.role})`);
    });

  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}

checkAdminTables();
