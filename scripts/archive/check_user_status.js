import pg from 'pg';

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';

const { Client } = pg;

async function checkUsersStatus() {
  console.log('--- Checking User Login Status ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1. Get all public profiles (People who should exist)
    const resProfiles = await client.query(`SELECT email, full_name, role FROM public.horapiaui_profiles`);
    const profiles = resProfiles.rows;

    // 2. Get all active auth users (People who CAN login)
    const resAuth = await client.query(`SELECT email FROM auth.users`);
    const authEmails = resAuth.rows.map(r => r.email);

    console.log(`\nTotal Profiles Found: ${profiles.length}`);
    console.log('------------------------------------------------');
    
    profiles.forEach(p => {
        const canLogin = authEmails.includes(p.email);
        console.log(`User: ${p.email} (${p.full_name || 'No Name'})`);
        console.log(`Role: ${p.role}`);
        console.log(`Login Status: ${canLogin ? 'OK (Active)' : 'BLOCKED (Needs Account Recreation)'}`);
        console.log('------------------------------------------------');
    });

  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}

checkUsersStatus();
