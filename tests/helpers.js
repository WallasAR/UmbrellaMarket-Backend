import jwt from "jsonwebtoken";

export const loadTestApp = async () => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://example.supabase.co";
  process.env.SUPABASE_API_KEY = process.env.SUPABASE_API_KEY || "test-key";
  process.env.JWT_TOKEN = process.env.JWT_TOKEN || "test-secret";
  process.env.STRIPE_KEY = process.env.STRIPE_KEY || "sk_test_dummy";

  const { default: app } = await import("../src/app.js");
  return app;
};

export const signTestToken = (overrides = {}) =>
  jwt.sign(
    {
      id: "test-user-id",
      email: "test@example.com",
      role: "customer",
      ...overrides
    },
    process.env.JWT_TOKEN
  );
