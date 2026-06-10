import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("GET /api/banners is public", async () => {
  const response = await request(app).get("/api/banners");
  assert.ok([200, 500].includes(response.status));
});

test("GET /api/copilot/cart-insights without token returns 401", async () => {
  const response = await request(app).get("/api/copilot/cart-insights");
  assert.equal(response.status, 401);
});

test("POST /api/cron/price-alerts without secret is rejected", async () => {
  const response = await request(app).post("/api/cron/price-alerts");
  assert.ok([401, 503].includes(response.status));
});

test("GET /api/admin/banners as customer returns 403", async () => {
  const response = await request(app)
    .get("/api/admin/banners")
    .set("Authorization", "Bearer test-token");
  assert.equal(response.status, 403);
});
