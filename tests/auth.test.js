import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp, signTestToken } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("GET /api/orders without token returns 401", async () => {
  const response = await request(app).get("/api/orders");

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Denied Access");
});

test("GET /api/orders with invalid token returns 403", async () => {
  const response = await request(app)
    .get("/api/orders")
    .set("Authorization", "invalid.token.value");

  assert.equal(response.status, 403);
  assert.equal(response.body.message, "Invalid token");
});

test("GET /api/orders with valid token does not return 401 or 403", async () => {
  const token = signTestToken();
  const response = await request(app)
    .get("/api/orders")
    .set("Authorization", token);

  assert.notEqual(response.status, 401);
  assert.notEqual(response.status, 403);
});

test("POST /api/auth/login with invalid body returns 400", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: "not-an-email", pass: "123" });

  assert.equal(response.status, 400);
  assert.ok(response.body.message);
});
