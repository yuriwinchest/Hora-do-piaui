import pg from 'pg';

// Direct connection string (bypassing pooler if possible)
// Format: postgres://[user]:[password]@[db-host]:5432/[db-name]
const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';

const { Client } = pg;

async function check() {
  console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'));
  
  const client = new Client({
    connectionString,
    // Supabase direct connection often requires SSL but might accept unauthorized
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected!');

    // List all tables
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables found:', res.rows.map(r => r.table_name).join(', '));
    
    // Count rows in each table
    for (const row of res.rows) {
        const t = row.table_name;
        const countRes = await client.query(`SELECT count(*) as total FROM public."${t}"`);
        console.log(`- ${t}: ${countRes.rows[0].total} rows`);
    }

  } catch (err) {
    console.error('Connection Error:', err.message);
  } finally {
    await client.end();
  }
}

check();
