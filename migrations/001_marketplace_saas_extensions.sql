-- Marketplace SaaS extensions for Supabase/PostgreSQL
-- Apply in order on the Supabase SQL editor

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS requires_prescription BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS active_ingredient TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS laboratory TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS pharmacy_id UUID;

ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS order_status TEXT NOT NULL DEFAULT 'pending_payment';
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS pharmacy_id UUID;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS "Pharmacy" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  cep TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Coupon" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Prescription" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id),
  medicine_id INTEGER NOT NULL REFERENCES "Medicine"(id),
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicine_category ON "Medicine"(category);
CREATE INDEX IF NOT EXISTS idx_medicine_pharmacy ON "Medicine"(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_purchase_user ON "Purchase"(user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_user ON "Prescription"(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"(user_id);
