import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

let app;

before(async () => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://example.supabase.co";
  process.env.SUPABASE_API_KEY = process.env.SUPABASE_API_KEY || "test-key";
  process.env.JWT_TOKEN = process.env.JWT_TOKEN || "test-secret";
  process.env.STRIPE_KEY = process.env.STRIPE_KEY || "sk_test_dummy";
  app = (await import("../src/app.js")).default;
});

test("GET /health returns ok", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.ok(response.body.timestamp);
});

test("GET / returns server online", async () => {
  const response = await request(app).get("/");

  assert.equal(response.status, 200);
  assert.match(response.text, /online/i);
});
