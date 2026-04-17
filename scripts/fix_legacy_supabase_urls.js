/**
 * Fix legacy Supabase project URLs stored in DB rows (permanent fix).
 *
 * Rewrites any absolute URL that points to a legacy Supabase host to the current project host.
 * Example: https://<legacy>.supabase.co/... -> https://<current>.supabase.co/...
 *
 * Env (required):
 * - POSTGRES_URL_NON_POOLING (recommended) OR POSTGRES_HOST + POSTGRES_PASSWORD
 * - SUPABASE_URL or VITE_SUPABASE_URL (used as the "current" host)
 *
 * Env (optional):
 * - LEGACY_SUPABASE_HOSTS="pxyekqpcgjwaztummzvh.supabase.co,other.supabase.co"
 */
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

function requireEnv(name, value) {
  const v = String(value || '').trim();
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

const currentSupabaseUrl = requireEnv('SUPABASE_URL/VITE_SUPABASE_URL', process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const currentOrigin = new URL(currentSupabaseUrl).origin;

const legacyHosts = String(process.env.LEGACY_SUPABASE_HOSTS || 'pxyekqpcgjwaztummzvh.supabase.co')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const legacyOrigins = legacyHosts.map((h) => `https://${h}`);

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  (() => {
    const host = String(process.env.POSTGRES_HOST || '').trim();
    const pass = String(process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '').trim();
    if (!host || !pass) return '';
    return `postgres://postgres:${encodeURIComponent(pass)}@${host}:5432/postgres?sslmode=require`;
  })();

requireEnv('POSTGRES_URL_NON_POOLING or POSTGRES_HOST+POSTGRES_PASSWORD', connectionString);

async function columnExists(client, table, column) {
  const res = await client.query(
    `select 1
       from information_schema.columns
      where table_schema='public' and table_name=$1 and column_name=$2
      limit 1`,
    [table, column]
  );
  return res.rowCount > 0;
}

async function updateColumn(client, table, column) {
  if (!(await columnExists(client, table, column))) return { table, column, updated: 0, skipped: true };

  let total = 0;
  for (const legacy of legacyOrigins) {
    const q = `
      update public.${table}
         set ${column} = replace(${column}, $1, $2)
       where ${column} is not null
         and ${column} like $3
    `;
    const like = `${legacy}%`;
    const res = await client.query(q, [legacy, currentOrigin, like]);
    total += res.rowCount || 0;
  }
  return { table, column, updated: total, skipped: false };
}

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const targets = [
      { table: 'horapiaui_news', columns: ['image', 'image_url', 'author_avatar'] },
      { table: 'advertising_banners', columns: ['image_url'] },
      { table: 'horapiaui_videos', columns: ['image', 'thumbnail', 'thumbnail_url'] },
    ];

    for (const t of targets) {
      for (const c of t.columns) {
        // eslint-disable-next-line no-await-in-loop
        const r = await updateColumn(client, t.table, c);
        if (!r.skipped) console.log(`[DB] ${r.table}.${r.column}: updated ${r.updated}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

