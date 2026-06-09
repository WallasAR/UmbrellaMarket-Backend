-- Reviews, subscriptions and webhook support

ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS allows_subscription BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS "Review" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id),
  medicine_id INTEGER NOT NULL REFERENCES "Medicine"(id),
  pharmacy_id UUID REFERENCES "Pharmacy"(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Subscription" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id),
  medicine_id INTEGER NOT NULL REFERENCES "Medicine"(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  interval_days INTEGER NOT NULL DEFAULT 30,
  next_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_medicine ON "Review"(medicine_id);
CREATE INDEX IF NOT EXISTS idx_subscription_user ON "Subscription"(user_id);
