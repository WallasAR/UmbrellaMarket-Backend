import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp, signTestToken } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("GET /api/subscriptions without token returns 401", async () => {
  const response = await request(app).get("/api/subscriptions");

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Denied Access");
});

test("DELETE /api/subscriptions/:id without token returns 401", async () => {
  const response = await request(app).delete("/api/subscriptions/sub-123");

  assert.equal(response.status, 401);
});

test("GET /api/subscriptions with valid token does not return 401", async () => {
  const token = signTestToken();
  const response = await request(app)
    .get("/api/subscriptions")
    .set("Authorization", token);

  assert.notEqual(response.status, 401);
  assert.notEqual(response.status, 403);
});
