import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SOURCE_CONNECTION =
  process.env.SOURCE_POSTGRES_URL_NON_POOLING ||
  process.env.SOURCE_POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL;

const TARGET_CONNECTION =
  process.env.TARGET_POSTGRES_URL_NON_POOLING ||
  process.env.TARGET_POSTGRES_URL ||
  process.env.NEW_POSTGRES_URL_NON_POOLING ||
  process.env.NEW_POSTGRES_URL;

const BACKUP_PATH =
  process.env.BACKUP_PATH || path.resolve(process.cwd(), 'hora-do-piaui-backup.json');

if (!SOURCE_CONNECTION) {
  console.error(
    'Fonte não configurada. Defina POSTGRES_URL_NON_POOLING (ou SOURCE_POSTGRES_URL_NON_POOLING) no .env.'
  );
  process.exit(1);
}

const BACKUP_ONLY = !TARGET_CONNECTION;

const { Client } = pg;

function createClient(connectionString) {
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

async function tableExists(client, tableName) {
  const { rows } = await client.query('select to_regclass($1) as reg', [`public.${tableName}`]);
  return Boolean(rows?.[0]?.reg);
}

async function pickExistingTable(client, candidates) {
  for (const name of candidates) {
    if (await tableExists(client, name)) return name;
  }
  return null;
}

async function ensureTargetSchema(target) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const sqlFiles = [
    path.resolve(__dirname, '../supabase/migrations/20260104025807_init_schema_hora_do_piaui.sql'),
    path.resolve(__dirname, '../supabase/migrations/create_profiles.sql'),
    path.resolve(__dirname, '../supabase/migrations/add_author_cols.sql'),
    path.resolve(__dirname, '../supabase/migrations/fixes_20240104.sql'),
    path.resolve(__dirname, '../supabase/migrations/add_urgent_column_v2.sql'),
    path.resolve(__dirname, '../supabase/migrations/20240106_add_image_description.sql'),
    path.resolve(__dirname, '../db_schema_banners.sql'),
    path.resolve(__dirname, '../db_schema_ads.sql'),
  ];

  for (const filePath of sqlFiles) {
    if (!fs.existsSync(filePath)) continue;
    const sql = fs.readFileSync(filePath, 'utf8');
    if (!sql.trim()) continue;
    try {
      await target.query(sql);
    } catch (e) {
      const msg = e?.message ? String(e.message) : String(e);
      console.error(`Falha ao aplicar SQL (${path.basename(filePath)}):`, msg);
    }
  }

  const postSql = `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    DO $$
    BEGIN
      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'news')
         AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'horapiaui_news') THEN
        ALTER TABLE public.news RENAME TO horapiaui_news;
      END IF;

      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'videos')
         AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'horapiaui_videos') THEN
        ALTER TABLE public.videos RENAME TO horapiaui_videos;
      END IF;

      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'home_layout')
         AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'horapiaui_home_layout') THEN
        ALTER TABLE public.home_layout RENAME TO horapiaui_home_layout;
      END IF;

      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')
         AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'horapiaui_profiles') THEN
        ALTER TABLE public.profiles RENAME TO horapiaui_profiles;
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS public.horapiaui_banners (
      id uuid default gen_random_uuid() primary key,
      title text not null default '',
      video_url text not null default '',
      alignment text not null default 'left',
      is_active boolean default true,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    CREATE TABLE IF NOT EXISTS public.advertising_banners (
      id uuid default gen_random_uuid() primary key,
      image_url text not null,
      link_url text,
      display_order integer default 0,
      is_active boolean default true,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    ALTER TABLE IF EXISTS public.horapiaui_news ADD COLUMN IF NOT EXISTS author_name text;
    ALTER TABLE IF EXISTS public.horapiaui_news ADD COLUMN IF NOT EXISTS author_avatar text;
    ALTER TABLE IF EXISTS public.horapiaui_news ADD COLUMN IF NOT EXISTS author_bio text;
    ALTER TABLE IF EXISTS public.horapiaui_news ADD COLUMN IF NOT EXISTS author_role text DEFAULT 'Jornalista';
    ALTER TABLE IF EXISTS public.horapiaui_news ADD COLUMN IF NOT EXISTS instagram_url text;
    ALTER TABLE IF EXISTS public.horapiaui_news ADD COLUMN IF NOT EXISTS image_description text;
    ALTER TABLE IF EXISTS public.horapiaui_news ADD COLUMN IF NOT EXISTS slug text;
    ALTER TABLE IF EXISTS public.horapiaui_news ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;
    ALTER TABLE IF EXISTS public.horapiaui_news ADD COLUMN IF NOT EXISTS video_url text;

    DO $$ BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS horapiaui_news_slug_unique_idx ON public.horapiaui_news (slug);
    EXCEPTION
      WHEN duplicate_table THEN null;
    END $$;

    ALTER TABLE IF EXISTS public.horapiaui_profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'Jornalista';

    CREATE OR REPLACE FUNCTION increment_news_views(news_id UUID)
    RETURNS VOID AS $$
    BEGIN
      UPDATE public.horapiaui_news
      SET views = COALESCE(views, 0) + 1
      WHERE id = news_id;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await target.query(postSql);
}

async function fetchAllRows(client, tableName) {
  const { rows } = await client.query(`select * from public.${tableName}`);
  return rows ?? [];
}

function buildInsertQuery(tableName, rows, keyColumn) {
  if (!rows.length) return null;

  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map((c) => `"${c}"`).join(', ');

  let paramIndex = 1;
  const valuesParts = [];
  const params = [];

  for (const row of rows) {
    const placeholders = [];
    for (const col of columns) {
      params.push(row[col]);
      placeholders.push(`$${paramIndex++}`);
    }
    valuesParts.push(`(${placeholders.join(', ')})`);
  }

  const updatableColumns = columns.filter((c) => c !== keyColumn);
  const setClause = updatableColumns
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(', ');

  const sql = `
    insert into public.${tableName} (${quotedColumns})
    values ${valuesParts.join(', ')}
    on conflict ("${keyColumn}") do update set ${setClause}
  `;

  return { sql, params };
}

async function upsertInBatches(target, tableName, rows, keyColumn, batchSize = 100) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const built = buildInsertQuery(tableName, batch, keyColumn);
    if (!built) continue;
    await target.query(built.sql, built.params);
  }
}

async function run() {
  const source = createClient(SOURCE_CONNECTION);

  await source.connect();
  const target = BACKUP_ONLY ? null : createClient(TARGET_CONNECTION);
  if (target) await target.connect();

  try {
    const sourceTables = {
      news: await pickExistingTable(source, ['horapiaui_news', 'news']),
      videos: await pickExistingTable(source, ['horapiaui_videos', 'videos']),
      homeLayout: await pickExistingTable(source, ['horapiaui_home_layout', 'home_layout']),
      profiles: await pickExistingTable(source, ['horapiaui_profiles', 'profiles']),
      banners: await pickExistingTable(source, ['horapiaui_banners']),
      ads: await pickExistingTable(source, ['advertising_banners']),
    };

    if (BACKUP_ONLY) {
      const backup = {
        generatedAt: new Date().toISOString(),
        sourceTables,
        data: {
          horapiaui_news: sourceTables.news ? await fetchAllRows(source, sourceTables.news) : [],
          horapiaui_videos: sourceTables.videos ? await fetchAllRows(source, sourceTables.videos) : [],
          horapiaui_home_layout: sourceTables.homeLayout
            ? await fetchAllRows(source, sourceTables.homeLayout)
            : [],
          horapiaui_profiles: sourceTables.profiles
            ? await fetchAllRows(source, sourceTables.profiles)
            : [],
          horapiaui_banners: sourceTables.banners ? await fetchAllRows(source, sourceTables.banners) : [],
          advertising_banners: sourceTables.ads ? await fetchAllRows(source, sourceTables.ads) : [],
        },
      };

      fs.writeFileSync(BACKUP_PATH, JSON.stringify(backup));
      console.log('Backup gerado em:', BACKUP_PATH);
      return;
    }

    await ensureTargetSchema(target);
    await target.query('begin');

    const tablePlan = [
      { source: sourceTables.news, target: 'horapiaui_news', key: 'id' },
      { source: sourceTables.videos, target: 'horapiaui_videos', key: 'id' },
      { source: sourceTables.homeLayout, target: 'horapiaui_home_layout', key: 'id' },
      { source: sourceTables.profiles, target: 'horapiaui_profiles', key: 'id' },
      { source: sourceTables.banners, target: 'horapiaui_banners', key: 'id' },
      { source: sourceTables.ads, target: 'advertising_banners', key: 'id' },
    ];

    for (const entry of tablePlan) {
      if (!entry.source) continue;
      const rows = await fetchAllRows(source, entry.source);
      if (!rows.length) continue;
      await upsertInBatches(target, entry.target, rows, entry.key);
    }

    await target.query('commit');

    if (sourceTables.news) {
      const { rows } = await source.query(`select count(*)::int as count from public.${sourceTables.news}`);
      console.log('Migração finalizada. Total de notícias na origem:', rows?.[0]?.count ?? 0);
    } else {
      console.log('Migração finalizada.');
    }
  } catch (e) {
    if (target) await target.query('rollback');
    throw e;
  } finally {
    await source.end();
    if (target) await target.end();
  }
}

run().catch((e) => {
  const msg = e?.message ? String(e.message) : String(e);
  console.error('Erro na migração:', msg);
  process.exit(1);
});
