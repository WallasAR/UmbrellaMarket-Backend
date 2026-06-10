-- Phase 8: courier external jobs, team permissions

ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS external_job_id TEXT;
ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS provider_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_delivery_external_job ON "Delivery"(external_job_id)
  WHERE external_job_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS "PharmacyStaffPermission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES "Pharmacy"(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pharmacy_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_staff_permission_user ON "PharmacyStaffPermission"(user_id, pharmacy_id);
