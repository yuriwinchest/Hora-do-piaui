-- Tabela para configuração do banner dinâmico
create table if not exists public.horapiaui_banners (
  id uuid default gen_random_uuid() primary key,
  title text not null default '',
  video_url text not null default '',
  alignment text not null default 'left', -- 'left', 'right'
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security) se necessário, ou política pública para leitura
alter table public.horapiaui_banners enable row level security;

-- Política de leitura pública
create policy "Banners are viewable by everyone" 
  on public.horapiaui_banners for select 
  using ( true );

-- Política de inserção/atualização apenas para autenticados (Admin)
create policy "Banners are editable by authenticated users" 
  on public.horapiaui_banners for all 
  using ( auth.role() = 'authenticated' );

-- Inserir configuração inicial padrão
insert into public.horapiaui_banners (title, video_url, alignment, is_active)
values (
  'Ao Hora Piauí, Sílvio Mendes fala sobre contas, Jeová, eleição da Câmara e secretariado',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'left',
  true
);
