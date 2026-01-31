-- Garantir que increment_site_visits está exposta para anon/authenticated (PostgREST)
GRANT EXECUTE ON FUNCTION public.increment_site_visits() TO anon;
GRANT EXECUTE ON FUNCTION public.increment_site_visits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_site_visits() TO service_role;

-- Garantir que increment_news_views está exposta
GRANT EXECUTE ON FUNCTION public.increment_news_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_news_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_news_views(UUID) TO service_role;

-- Garantir SELECT em horapiaui_banners para anon (evitar 406 por RLS)
GRANT SELECT ON public.horapiaui_banners TO anon;
GRANT SELECT ON public.horapiaui_banners TO authenticated;
