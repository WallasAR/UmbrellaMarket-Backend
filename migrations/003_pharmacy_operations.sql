-- Pharmacy operations: staff assignment, batches, operational status

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS pharmacy_id UUID REFERENCES "Pharmacy"(id);

ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS operational_status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES "User"(id);

CREATE TABLE IF NOT EXISTS "MedicineBatch" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES "Pharmacy"(id),
  medicine_id INTEGER NOT NULL REFERENCES "Medicine"(id),
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicine_batch_pharmacy ON "MedicineBatch"(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_medicine_batch_medicine ON "MedicineBatch"(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medicine_batch_expiry ON "MedicineBatch"(expiry_date);
