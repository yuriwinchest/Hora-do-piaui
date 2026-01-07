-- Script de Correção Forçada para a coluna is_urgent
-- Copie e cole TODO este conteúdo no SQL Editor do Supabase e clique em RUN

-- 1. Garante que a coluna exista na tabela horapiaui_news
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'horapiaui_news') THEN
        ALTER TABLE public.horapiaui_news ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Garante que a coluna exista na tabela news (caso ainda não tenha sido renomeada)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'news') THEN
        ALTER TABLE public.news ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Força a atualização do cache do Supabase API
NOTIFY pgrst, 'reload schema';
