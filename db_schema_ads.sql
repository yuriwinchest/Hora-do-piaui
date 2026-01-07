-- Tabela para banners de publicidade rotativos
create table if not exists public.advertising_banners (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  link_url text,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.advertising_banners enable row level security;

-- Política de leitura pública
create policy "Ads are viewable by everyone" 
  on public.advertising_banners for select 
  using ( true );

-- Política de edição para autenticados
create policy "Ads are editable by authenticated users" 
  on public.advertising_banners for all 
  using ( auth.role() = 'authenticated' );

-- Configurar Storage Bucket para ads
insert into storage.buckets (id, name, public) 
values ('ads', 'ads', true)
on conflict (id) do nothing;

-- Políticas de Storage para 'ads'
create policy "Public Access Ads" 
  on storage.objects for select 
  using ( bucket_id = 'ads' );

create policy "Authenticated Upload Ads" 
  on storage.objects for insert 
  with check ( bucket_id = 'ads' and auth.role() = 'authenticated' );

create policy "Authenticated Update Ads" 
  on storage.objects for update 
  using ( bucket_id = 'ads' and auth.role() = 'authenticated' );

create policy "Authenticated Delete Ads" 
  on storage.objects for delete 
  using ( bucket_id = 'ads' and auth.role() = 'authenticated' );
