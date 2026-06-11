-- Adicionar suporte multi-tenant para os Banners Institucionais
ALTER TABLE "InstitutionalBanner" 
ADD COLUMN IF NOT EXISTS pharmacy_id UUID REFERENCES "Pharmacy"(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_banner_pharmacy ON "InstitutionalBanner"(pharmacy_id);
