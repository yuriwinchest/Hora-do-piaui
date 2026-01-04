
-- 1. Ensure columns exist (Fixes "column bio does not exist")
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Make full_name nullable to prevent create errors
ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;

-- 3. Update the trigger to handle empty names safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create/Update Admin User "horapiaui@gmail.com"
-- Requires pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (id, email, password, email_confirmed_at, raw_user_meta_data)
VALUES (
    gen_random_uuid(), 
    'horapiaui@gmail.com', 
    crypt('Horadopiaui123', gen_salt('bf')), 
    now(),
    '{"full_name": "Redação Hora do Piauí"}'
)
ON CONFLICT (email) DO UPDATE 
SET 
  password = crypt('Horadopiaui123', gen_salt('bf')),
  email_confirmed_at = now(),
  raw_user_meta_data = '{"full_name": "Redação Hora do Piauí"}';

-- 5. Create/Update Admin Profile
INSERT INTO public.profiles (id, email, full_name, bio, avatar_url)
SELECT 
    id, 
    email, 
    'Redação Hora do Piauí', 
    'Diretor do Hora Piauí, o jornalista já atuou como comentarista político da TV Meio Norte, com passagem como correspondente em Brasília. Também apresentou o programa Grande Jornal Lupa1 e foi editor-geral do portal Central Piauí. Soma mais de 10 anos de experiência em assessoria política e na coordenação de campanhas eleitorais.',
    'https://ui-avatars.com/api/?name=MW&background=random'
FROM auth.users WHERE email = 'horapiaui@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url;
