-- Garantir que anon (e service_role) possam ler horapiaui_news (para servidor OG e frontend).
-- Útil se a tabela foi renomeada de "news" para "horapiaui_news" e permissões não seguiram.

GRANT SELECT ON public.horapiaui_news TO anon;
GRANT SELECT ON public.horapiaui_news TO authenticated;

-- Política de leitura pública (se a tabela tiver RLS e a política não existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'horapiaui_news') THEN
    ALTER TABLE public.horapiaui_news ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'horapiaui_news' AND policyname = 'Allow public read') THEN
      CREATE POLICY "Allow public read" ON public.horapiaui_news FOR SELECT USING (true);
    END IF;
  END IF;
END $$;
