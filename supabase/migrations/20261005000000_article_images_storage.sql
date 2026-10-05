-- ==============================================================================
-- NPL Hub Nepal — Supabase Storage: Article Images Bucket
-- ==============================================================================

-- 1. Create the article-images bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];

-- 2. Public read policy for article images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Public read access for article images'
  ) THEN
    CREATE POLICY "Public read access for article images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'article-images');
  END IF;
END $$;
