import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp, signTestToken } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("GET /api/onboarding/status without token returns 401", async () => {
  const response = await request(app).get("/api/onboarding/status");

  assert.equal(response.status, 401);
});

test("POST /api/onboarding/register with invalid body returns 400", async () => {
  const token = signTestToken();
  const response = await request(app)
    .post("/api/onboarding/register")
    .set("Authorization", token)
    .send({ name: "A" });

  assert.equal(response.status, 400);
  assert.ok(response.body.message);
});

test("GET /api/onboarding/plans is reachable without auth", async () => {
  const response = await request(app).get("/api/onboarding/plans");

  assert.notEqual(response.status, 401);
  assert.notEqual(response.status, 403);
});
