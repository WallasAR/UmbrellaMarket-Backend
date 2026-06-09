import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp, signTestToken } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("POST /api/coupons/validate without token returns 401", async () => {
  const response = await request(app)
    .post("/api/coupons/validate")
    .send({ code: "UMBRELLA10", subtotal: 100 });

  assert.equal(response.status, 401);
});

test("POST /api/coupons/validate with invalid body returns 400", async () => {
  const token = signTestToken();
  const response = await request(app)
    .post("/api/coupons/validate")
    .set("Authorization", token)
    .send({ code: "A" });

  assert.equal(response.status, 400);
});
