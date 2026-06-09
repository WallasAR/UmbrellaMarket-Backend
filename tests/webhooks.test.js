import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp } from "./helpers.js";

let app;

before(async () => {
  process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_webhook_secret";
  app = await loadTestApp();
});

test("POST /api/webhooks/stripe without signature returns 400", async () => {
  const response = await request(app)
    .post("/api/webhooks/stripe")
    .set("Content-Type", "application/json")
    .send({ type: "checkout.session.completed" });

  assert.equal(response.status, 400);
  assert.ok(response.body.message);
});

test("POST /api/webhooks/stripe with invalid signature returns 400", async () => {
  const payload = JSON.stringify({ id: "evt_invalid", type: "checkout.session.completed" });

  const response = await request(app)
    .post("/api/webhooks/stripe")
    .set("Content-Type", "application/json")
    .set("stripe-signature", "invalid-signature")
    .send(payload);

  assert.equal(response.status, 400);
});
