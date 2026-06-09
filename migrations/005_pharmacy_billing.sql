-- Pharmacy SaaS billing via Stripe

ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ;

ALTER TABLE "SaasPlan" ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_pharmacy_billing ON "Pharmacy"(billing_status);
CREATE INDEX IF NOT EXISTS idx_pharmacy_stripe_sub ON "Pharmacy"(stripe_subscription_id);
