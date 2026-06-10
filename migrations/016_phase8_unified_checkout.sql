-- Phase 8: unified multi-pharmacy checkout split plan

ALTER TABLE "OrderGroup" ADD COLUMN IF NOT EXISTS split_plan JSONB;
ALTER TABLE "OrderGroup" ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE "OrderGroup" ADD COLUMN IF NOT EXISTS checkout_mode TEXT DEFAULT 'split';

CREATE INDEX IF NOT EXISTS idx_order_group_stripe_session ON "OrderGroup"(stripe_session_id);
