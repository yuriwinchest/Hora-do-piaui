import pg from 'pg';

// Target: RAX (VPS Project)
const connectionString = 'postgres://postgres:Fatopago%402026@db.raxjzfvunjxqbxswuipp.supabase.co:5432/postgres';

const { Client } = pg;

async function check() {
  console.log('Testing password on Target (RAX)...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('SUCCESS! Password works on Target.');
    
    // Create tables if not exist
    await createSchema(client);
    
  } catch (err) {
    console.error('Password Failed on Target:', err.message);
  } finally {
    await client.end();
  }
}

async function createSchema(client) {
    console.log('Creating Schema...');
    const sql = `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS public.horapiaui_news (
      id uuid default gen_random_uuid() primary key,
      title text not null,
      subtitle text,
      content text,
      category text,
      image_url text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
      author_name text,
      author_avatar text,
      author_bio text,
      author_role text DEFAULT 'Jornalista',
      instagram_url text,
      image_description text,
      slug text,
      views integer DEFAULT 0,
      video_url text,
      status text default 'published',
      featured boolean default false
    );

    CREATE TABLE IF NOT EXISTS public.horapiaui_videos (
        id uuid default gen_random_uuid() primary key,
        title text,
        description text,
        youtube_url text,
        thumbnail_url text,
        featured boolean default false,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    CREATE TABLE IF NOT EXISTS public.horapiaui_profiles (
        id uuid references auth.users not null primary key,
        email text,
        role text default 'Jornalista',
        name text,
        avatar_url text,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    CREATE TABLE IF NOT EXISTS public.horapiaui_banners (
      id uuid default gen_random_uuid() primary key,
      title text default '',
      video_url text default '',
      alignment text default 'left',
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
    
    CREATE TABLE IF NOT EXISTS public.horapiaui_home_layout (
        id uuid default gen_random_uuid() primary key,
        section_order jsonb,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Indexes
    CREATE UNIQUE INDEX IF NOT EXISTS horapiaui_news_slug_idx ON public.horapiaui_news (slug);
    `;
    
    await client.query(sql);
    console.log('Schema Created Successfully.');
}

check();
