-- Phase 4: copilot sessions, prescription bulk cart, sponsored click tracking

CREATE TABLE IF NOT EXISTS "CopilotSession" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_session_user ON "CopilotSession"(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS "CopilotMessage" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES "CopilotSession"(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_message_session ON "CopilotMessage"(session_id, created_at);

CREATE TABLE IF NOT EXISTS "SponsoredClick" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boost_id UUID REFERENCES "SponsoredBoost"(id) ON DELETE SET NULL,
  pharmacy_id UUID NOT NULL REFERENCES "Pharmacy"(id) ON DELETE CASCADE,
  medicine_id INTEGER NOT NULL REFERENCES "Medicine"(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'listing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsored_click_pharmacy ON "SponsoredClick"(pharmacy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsored_click_boost ON "SponsoredClick"(boost_id);
