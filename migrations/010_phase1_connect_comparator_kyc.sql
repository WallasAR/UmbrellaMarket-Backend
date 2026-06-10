-- Phase 1: Stripe Connect, medicine comparator, KYC documents, subscription renewal tracking

ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS connect_onboarding_status TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS connect_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS connect_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS medicine_type TEXT NOT NULL DEFAULT 'reference';
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS dosage TEXT;

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS last_invoice_id TEXT;

CREATE TABLE IF NOT EXISTS "KycDocument" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES "Pharmacy"(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_pharmacy ON "KycDocument"(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_medicine_active_ingredient ON "Medicine"(active_ingredient);
CREATE INDEX IF NOT EXISTS idx_pharmacy_connect ON "Pharmacy"(stripe_connect_account_id);
