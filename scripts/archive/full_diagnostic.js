import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';
const { Client } = pg;

async function fullDiagnostic() {
  console.log('--- Full Diagnostic ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1. Check RPC Function
    console.log('\n1. Checking RPC function...');
    const funcRes = await client.query(`
        SELECT routine_name FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'increment_site_visits';
    `);
    console.log(`   increment_site_visits exists: ${funcRes.rowCount > 0 ? 'YES' : 'NO'}`);

    // 2. Check Banners Table & RLS
    console.log('\n2. Checking horapiaui_banners...');
    const bannersRes = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'horapiaui_banners';
    `);
    console.log(`   Columns: ${bannersRes.rows.map(r => r.column_name).join(', ')}`);
    
    // Check RLS status
    const rlsRes = await client.query(`
        SELECT relrowsecurity FROM pg_class WHERE relname = 'horapiaui_banners';
    `);
    console.log(`   RLS Enabled: ${rlsRes.rows[0]?.relrowsecurity ? 'YES' : 'NO'}`);

    // Check policies
    const polRes = await client.query(`
        SELECT policyname FROM pg_policies WHERE tablename = 'horapiaui_banners';
    `);
    console.log(`   Policies: ${polRes.rows.map(r => r.policyname).join(', ') || 'NONE'}`);

    // 3. Test data access
    console.log('\n3. Testing data access...');
    const dataRes = await client.query(`SELECT * FROM public.horapiaui_banners LIMIT 1;`);
    console.log(`   Banners count: ${dataRes.rowCount}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

fullDiagnostic();
