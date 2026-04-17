import pg from 'pg';

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';

const { Client } = pg;

async function checkAndFixProfile() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1. Check Columns
    const res = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'horapiaui_profiles';
    `);
    const cols = res.rows.map(r => r.column_name);
    console.log('Columns:', cols.join(', '));

    // 2. Identify Name column (usually name, full_name, username)
    // Based on previous errors, 'name' does not exist.
    // Let's guess 'lastname' was seen before?
    // "id, name, lastname..." was seen in inspect_source.js output for profiles.
    // Wait, inspect_source.js was for OLD DB.
    // Let's rely on what we see now.

    const nameCol = cols.includes('name') ? 'name' : (cols.includes('full_name') ? 'full_name' : null);
    
    // 3. Insert Profile
    // We know the User ID from previous step: 5e1ed1b8-1fe3-46e4-a51e-b4c2cbafe090
    // And Email: horapiaui@gmail.com
    
    if (nameCol) {
         console.log(`Inserting profile using column: ${nameCol}`);
         await client.query(`
            INSERT INTO public.horapiaui_profiles (id, email, role, ${nameCol})
            VALUES ('5e1ed1b8-1fe3-46e4-a51e-b4c2cbafe090', 'horapiaui@gmail.com', 'admin', 'Admin')
            ON CONFLICT (id) DO UPDATE SET role = 'admin';
         `);
    } else {
         console.log('No name column found, inserting without name...');
         await client.query(`
            INSERT INTO public.horapiaui_profiles (id, email, role)
            VALUES ('5e1ed1b8-1fe3-46e4-a51e-b4c2cbafe090', 'horapiaui@gmail.com', 'admin')
            ON CONFLICT (id) DO UPDATE SET role = 'admin';
         `);
    }
    console.log('Profile Fixed.');

  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}

checkAndFixProfile();
