-- Phase 3: symptom search, sponsored boosts, copilot logs

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS symptoms TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_medicine_symptoms ON "Medicine" USING GIN (symptoms);
CREATE INDEX IF NOT EXISTS idx_medicine_name_trgm ON "Medicine" USING GIN (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS "SponsoredBoost" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES "Pharmacy"(id) ON DELETE CASCADE,
  medicine_id INTEGER NOT NULL REFERENCES "Medicine"(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 1,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsored_boost_active ON "SponsoredBoost"(active, ends_at);
CREATE INDEX IF NOT EXISTS idx_sponsored_boost_medicine ON "SponsoredBoost"(medicine_id);

CREATE TABLE IF NOT EXISTS "CopilotLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  intent TEXT NOT NULL,
  input_text TEXT,
  response_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
