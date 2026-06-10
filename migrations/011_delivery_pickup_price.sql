-- Phase 2: delivery, pickup, price alerts and price history

ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS fulfillment_mode TEXT NOT NULL DEFAULT 'delivery';
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "Delivery" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id TEXT NOT NULL,
  pharmacy_id UUID REFERENCES "Pharmacy"(id) ON DELETE SET NULL,
  user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  courier TEXT NOT NULL DEFAULT 'local',
  status TEXT NOT NULL DEFAULT 'pending',
  quoted_price NUMERIC NOT NULL DEFAULT 0,
  eta_minutes INTEGER,
  tracking_url TEXT,
  destination_address TEXT,
  destination_lat NUMERIC,
  destination_lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_purchase ON "Delivery"(purchase_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON "Delivery"(status);

CREATE TABLE IF NOT EXISTS "PickupOrder" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id TEXT NOT NULL UNIQUE,
  pharmacy_id UUID NOT NULL REFERENCES "Pharmacy"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  pickup_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  picked_up_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_code ON "PickupOrder"(pickup_code);

CREATE TABLE IF NOT EXISTS "PriceAlert" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  medicine_id INTEGER NOT NULL REFERENCES "Medicine"(id) ON DELETE CASCADE,
  target_price NUMERIC NOT NULL,
  notify_push BOOLEAN NOT NULL DEFAULT TRUE,
  notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alert_user ON "PriceAlert"(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alert_active ON "PriceAlert"(active) WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS "PriceHistory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id INTEGER NOT NULL REFERENCES "Medicine"(id) ON DELETE CASCADE,
  pharmacy_id UUID REFERENCES "Pharmacy"(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  final_price NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_medicine ON "PriceHistory"(medicine_id, recorded_at);
