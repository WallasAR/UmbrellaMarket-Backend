-- Phase 7: institutional banners, pg_trgm fuzzy search RPC

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS "InstitutionalBanner" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  category TEXT,
  sponsor TEXT,
  gradient TEXT DEFAULT 'from-[#F74838] to-[#ff7a6f]',
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_institutional_banner_active ON "InstitutionalBanner"(active, priority DESC);

CREATE OR REPLACE FUNCTION fuzzy_search_medicine_ids(search text, result_limit int DEFAULT 20)
RETURNS TABLE(id int, score real)
LANGUAGE sql
STABLE
AS $$
  SELECT m.id,
    GREATEST(
      similarity(m.name, search),
      similarity(COALESCE(m.active_ingredient, ''), search),
      similarity(COALESCE(m.description, ''), search)
    ) AS score
  FROM "Medicine" m
  WHERE m.stock > 0
    AND (
      m.name ILIKE '%' || search || '%'
      OR COALESCE(m.active_ingredient, '') ILIKE '%' || search || '%'
      OR similarity(m.name, search) > 0.15
      OR similarity(COALESCE(m.active_ingredient, ''), search) > 0.15
    )
  ORDER BY score DESC
  LIMIT result_limit;
$$;
