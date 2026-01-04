-- Make full_name nullable to avoid constraint errors during backfill
ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;

-- Backfill profiles ensuring full_name is at least null or has a default
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Usuário') -- Fallback to 'Usuário' if null
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

-- Add author_bio to news if not exists
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS author_bio text;

-- Update the admin profile with specific provided data
UPDATE public.profiles
SET
  full_name = 'Mariano Wikoli',
  bio = 'Diretor do Hora Piauí, o jornalista já atuou como comentarista político da TV Meio Norte, com passagem como correspondente em Brasília. Também apresentou o programa Grande Jornal Lupa1 e foi editor-geral do portal Central Piauí. Soma mais de 10 anos de experiência em assessoria política e na coordenação de campanhas eleitorais.',
  avatar_url = 'https://ui-avatars.com/api/?name=MW&background=random'
WHERE email = 'horapiaui@gmail.com';

-- Enforce password update (requires pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE auth.users
SET encrypted_password = crypt('HoraPiauí123', gen_salt('bf'))
WHERE email = 'horapiaui@gmail.com';
