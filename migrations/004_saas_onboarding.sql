-- SaaS onboarding, plans and financial tracking

CREATE TABLE IF NOT EXISTS "SaasPlan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  max_products INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO "SaasPlan" (tier, name, monthly_price, commission_rate, max_products)
VALUES
  ('free', 'Gratuito', 0, 0.12, 50),
  ('pro', 'Profissional', 99.90, 0.08, 500),
  ('enterprise', 'Empresarial', 299.90, 0.05, NULL)
ON CONFLICT (tier) DO NOTHING;

ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 0;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS pharmacy_net NUMERIC DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_pharmacy_onboarding ON "Pharmacy"(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_purchase_created ON "Purchase"(created_at);
