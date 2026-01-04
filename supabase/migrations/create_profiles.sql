-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  bio text,
  email text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (safe drop)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill existing users (Insert if not exists)
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Add author_bio to news table
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS author_bio text;

-- Seed Admin Data (Try to update for the specific email)
UPDATE public.profiles
SET
  full_name = 'Redação Hora do Piauí',
  bio = 'Diretor do Hora Piauí, o jornalista já atuou como comentarista político da TV Meio Norte, com passagem como correspondente em Brasília. Também apresentou o programa Grande Jornal Lupa1 e foi editor-geral do portal Central Piauí. Soma mais de 10 anos de experiência em assessoria política e na coordenação de campanhas eleitorais.',
  avatar_url = 'https://ui-avatars.com/api/?name=MW&background=random'
WHERE email = 'horapiaui@gmail.com';
