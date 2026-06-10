-- Phase 5/6: order grouping, prescription lists, staff permissions seed

CREATE TABLE IF NOT EXISTS "OrderGroup" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_group_user ON "OrderGroup"(user_id, created_at DESC);

ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS order_group_id UUID REFERENCES "OrderGroup"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_order_group ON "Purchase"(order_group_id);

CREATE TABLE IF NOT EXISTS "PrescriptionList" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Minha receita',
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PrescriptionListItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES "PrescriptionList"(id) ON DELETE CASCADE,
  medicine_id INTEGER REFERENCES "Medicine"(id) ON DELETE SET NULL,
  matched_term TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescription_list_user ON "PrescriptionList"(user_id);
