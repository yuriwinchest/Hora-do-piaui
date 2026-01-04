CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
    CREATE TYPE news_status AS ENUM ('draft', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT,
    section TEXT,
    date TEXT,
    time TEXT,
    is_large BOOLEAN DEFAULT false,
    status news_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    thumbnail TEXT,
    url TEXT,
    tag TEXT,
    tag_color TEXT,
    duration TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.home_layout (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    main_headline TEXT,
    hero_main_id UUID REFERENCES public.news(id) ON DELETE SET NULL,
    hero_top_ids UUID[] DEFAULT '{}',
    hero_side_ids UUID[] DEFAULT '{}',
    mariano_main_id UUID REFERENCES public.news(id) ON DELETE SET NULL,
    mariano_list_ids UUID[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.home_layout (id, main_headline)
VALUES (1, 'Bem-vindo ao Hora do Piauí')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);
CREATE INDEX IF NOT EXISTS idx_news_status ON public.news(status);
CREATE INDEX IF NOT EXISTS news_title_trgm_idx ON public.news USING GIST (title gist_trgm_ops);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_home_layout_updated_at BEFORE UPDATE ON public.home_layout FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_layout ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read" ON public.news FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read" ON public.videos FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read" ON public.home_layout FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all for now" ON public.news FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all for now" ON public.videos FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all for now" ON public.home_layout FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
