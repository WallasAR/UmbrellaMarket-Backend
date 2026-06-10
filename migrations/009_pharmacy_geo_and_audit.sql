-- Pharmacy geolocation and audit trail (Phase 0)

ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS longitude NUMERIC;

CREATE INDEX IF NOT EXISTS idx_pharmacy_geo ON "Pharmacy"(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE TABLE IF NOT EXISTS "AuditLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON "AuditLog"(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON "AuditLog"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON "AuditLog"(created_at);
