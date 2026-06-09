import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("API responses include standard rate limit headers", async () => {
  const response = await request(app).get("/api/notifications/vapid-public-key");

  assert.equal(response.status, 200);
  assert.ok(response.headers["ratelimit-limit"]);
  assert.ok(response.headers["ratelimit-remaining"]);
  assert.ok(Number(response.headers["ratelimit-limit"]) > 0);
});
