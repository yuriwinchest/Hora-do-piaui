-- 1. Add views column if not exists
ALTER TABLE IF EXISTS public.horapiaui_news 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2. Create increment_news_views RPC function
CREATE OR REPLACE FUNCTION public.increment_news_views(news_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE horapiaui_news
    SET views = COALESCE(views, 0) + 1
    WHERE id = news_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Storage: Allow authenticated users to upload to images bucket
-- Drop only our policies to avoid conflicts with existing
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');
