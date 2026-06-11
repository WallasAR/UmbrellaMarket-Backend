-- Phase 9: Dynamic UI Layouts & Search History

CREATE TABLE IF NOT EXISTS "PharmacyLayout" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES "Pharmacy"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_preset BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PharmacyLayoutSection" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID REFERENCES "PharmacyLayout"(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- 'hero_carousel', 'category_circles', 'product_slider', 'promo_grid'
  title TEXT,
  subtitle TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PharmacyLayoutItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES "PharmacyLayoutSection"(id) ON DELETE CASCADE,
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SearchHistory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  session_id TEXT,
  term TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pharmacy_layout_pharmacy_active ON "PharmacyLayout"(pharmacy_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pharmacy_layout_section_order ON "PharmacyLayoutSection"(layout_id, display_order);
CREATE INDEX IF NOT EXISTS idx_pharmacy_layout_item_order ON "PharmacyLayoutItem"(section_id, display_order);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON "SearchHistory"(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_session ON "SearchHistory"(session_id, created_at DESC);

-- Enable RLS
ALTER TABLE "PharmacyLayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PharmacyLayoutSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PharmacyLayoutItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SearchHistory" ENABLE ROW LEVEL SECURITY;

-- Layout RLS policies (Public can read active layout, Admin can manage)
CREATE POLICY "Public can view active layouts" ON "PharmacyLayout" FOR SELECT USING (is_active = true OR is_preset = true);
CREATE POLICY "Public can view active sections" ON "PharmacyLayoutSection" FOR SELECT USING (true);
CREATE POLICY "Public can view active items" ON "PharmacyLayoutItem" FOR SELECT USING (true);

-- Search history policies
CREATE POLICY "Users can manage own search history" ON "SearchHistory" FOR ALL USING (
  (user_id IS NOT NULL AND user_id = auth.uid()) OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Initial Presets for Default Marketplace Layout
INSERT INTO "PharmacyLayout" (id, name, is_preset, is_active) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Default Modern Layout', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO "PharmacyLayoutSection" (id, layout_id, section_type, title, display_order, config) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'hero_carousel', null, 10, '{}'::jsonb),
  ('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000001', 'category_circles', 'Compre por Categoria', 20, '{}'::jsonb),
  ('11111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000001', 'product_slider', 'Medicamentos em destaque', 30, '{"filter": {"is_featured": true}}'::jsonb),
  ('11111111-1111-1111-1111-111111111114', '00000000-0000-0000-0000-000000000001', 'promo_grid', 'Ofertas Especiais', 40, '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- Populate some preset category items
INSERT INTO "PharmacyLayoutItem" (section_id, title, metadata, display_order) VALUES
  ('11111111-1111-1111-1111-111111111112', 'Higiene', '{"icon": "hygiene"}'::jsonb, 1),
  ('11111111-1111-1111-1111-111111111112', 'Vitaminas', '{"icon": "vitamins"}'::jsonb, 2),
  ('11111111-1111-1111-1111-111111111112', 'Fitness', '{"icon": "fitness"}'::jsonb, 3),
  ('11111111-1111-1111-1111-111111111112', 'Diabetes', '{"icon": "diabetes"}'::jsonb, 4)
ON CONFLICT DO NOTHING;
