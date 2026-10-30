-- ==============================================================================
-- NPL Hub Nepal — SEO Keywords & Image Metadata
-- Migration: 20261030000000_seo_and_image_fields.sql
-- Description: Adds focus_keyword, secondary_keywords, image_alt, image_caption
--              columns to news_articles. All operations use IF NOT EXISTS — safe to re-run.
-- ==============================================================================

-- Focus keyword for SEO (single primary keyword)
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT;

-- Secondary / related keywords for SEO (stored as jsonb text array)
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS secondary_keywords JSONB;

-- Featured image ALT text for accessibility and SEO
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS image_alt TEXT;

-- Featured image caption displayed below the image
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS image_caption TEXT;

-- Index on focus_keyword for potential keyword-based queries
CREATE INDEX IF NOT EXISTS idx_news_articles_focus_keyword
  ON public.news_articles(focus_keyword)
  WHERE focus_keyword IS NOT NULL;
