-- Browser push notification subscriptions

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS push_subscription JSONB;
