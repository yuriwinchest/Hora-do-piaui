DO $$
BEGIN
    -- 1. Renomear tabela 'news' para 'horapiaui_news' se necessário
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'news') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'horapiaui_news') THEN
        ALTER TABLE public.news RENAME TO horapiaui_news;
    END IF;

    -- 2. Renomear tabela 'videos' para 'horapiaui_videos' se necessário
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'videos') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'horapiaui_videos') THEN
        ALTER TABLE public.videos RENAME TO horapiaui_videos;
    END IF;

    -- 3. Renomear tabela 'home_layout' para 'horapiaui_home_layout' se necessário
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'home_layout') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'horapiaui_home_layout') THEN
        ALTER TABLE public.home_layout RENAME TO horapiaui_home_layout;
    END IF;

    -- 4. Adicionar a coluna is_urgent na tabela correta (agora deve ser horapiaui_news)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'horapiaui_news') THEN
        ALTER TABLE public.horapiaui_news ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
    ELSE
        -- Fallback: Se por algum motivo a tabela news ainda existir (e não foi renomeada acima por conflito?), tenta nela
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'news') THEN
             ALTER TABLE public.news ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
        END IF;
    END IF;
END $$;
