import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp, signTestToken } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("GET /api/notifications/vapid-public-key returns publicKey field", async () => {
  const response = await request(app).get("/api/notifications/vapid-public-key");

  assert.equal(response.status, 200);
  assert.ok("publicKey" in response.body);
});

test("GET /api/notifications/vapid-public-key returns configured key", async () => {
  process.env.VAPID_PUBLIC_KEY = "test-vapid-public";

  const response = await request(app).get("/api/notifications/vapid-public-key");

  assert.equal(response.body.publicKey, "test-vapid-public");
  delete process.env.VAPID_PUBLIC_KEY;
});

test("POST /api/notifications/push-subscribe without token returns 401", async () => {
  const response = await request(app)
    .post("/api/notifications/push-subscribe")
    .send({
      endpoint: "https://push.example.com/sub",
      keys: { p256dh: "key", auth: "auth" }
    });

  assert.equal(response.status, 401);
});

test("POST /api/notifications/push-subscribe with invalid body returns 400", async () => {
  const token = signTestToken();
  const response = await request(app)
    .post("/api/notifications/push-subscribe")
    .set("Authorization", token)
    .send({ endpoint: "not-a-url" });

  assert.equal(response.status, 400);
});
