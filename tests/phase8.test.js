import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("POST /api/checkout/cart without token returns 401", async () => {
  const response = await request(app).post("/api/checkout/cart").send({});
  assert.equal(response.status, 401);
});

test("GET /api/orders/groups without token returns 401", async () => {
  const response = await request(app).get("/api/orders/groups");
  assert.equal(response.status, 401);
});
