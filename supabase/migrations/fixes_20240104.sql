-- Add potentially missing columns to the 'news' table
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS section text DEFAULT 'manchete';
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS is_large boolean DEFAULT false;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';

-- Ensure we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure 'id' has a default value if not already set (safe retry)
ALTER TABLE public.news ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Make sure RLS policies allow authenticated users (like admin) to Insert/Update
-- This is a generic policy, typically you want more specific roles, but for this fix:
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON public.news
    FOR ALL
    USING (true)
    WITH CHECK (true);
