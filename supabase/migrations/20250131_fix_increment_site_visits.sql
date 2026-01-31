-- Dropar e recriar (mudar void para jsonb requer DROP primeiro)
DROP FUNCTION IF EXISTS public.increment_site_visits();

CREATE FUNCTION public.increment_site_visits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.horapiaui_site_stats
  SET visits_count = COALESCE(visits_count, 0) + 1
  WHERE id = 'main' OR id = 1;
  RETURN '{"ok": true}'::jsonb;
EXCEPTION WHEN OTHERS THEN
  RETURN '{"ok": false}'::jsonb;
END;
$$;

-- Garantir permissões para anon e authenticated
GRANT EXECUTE ON FUNCTION public.increment_site_visits() TO anon;
GRANT EXECUTE ON FUNCTION public.increment_site_visits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_site_visits() TO service_role;
