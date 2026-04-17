import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const conn = `postgres://postgres:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}@${process.env.POSTGRES_HOST}:5432/postgres?sslmode=require`;
const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

async function run() {
  await c.connect();
  const banners = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='horapiaui_banners' ORDER BY ordinal_position`);
  const stats = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='horapiaui_site_stats' ORDER BY ordinal_position`);
  const funcs = await c.query(`SELECT routine_name FROM information_schema.routines WHERE routine_schema='public' AND routine_name IN ('increment_site_visits','increment_news_views')`);
  console.log('horapiaui_banners cols:', banners.rows.map(r=>r.column_name).join(', '));
  console.log('horapiaui_site_stats:', stats.rows.length ? stats.rows.map(r=>r.column_name).join(', ') : 'NAO EXISTE');
  console.log('RPCs existentes:', funcs.rows.map(r=>r.routine_name).join(', '));
  await c.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
