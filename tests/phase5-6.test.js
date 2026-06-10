import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("GET /api/orders/groups without token returns 401", async () => {
  const response = await request(app).get("/api/orders/groups");
  assert.equal(response.status, 401);
});

test("GET /api/prescriptions/lists without token returns 401", async () => {
  const response = await request(app).get("/api/prescriptions/lists");
  assert.equal(response.status, 401);
});

test("GET /api/admin/audit-logs as customer returns 403", async () => {
  const response = await request(app)
    .get("/api/admin/audit-logs")
    .set("Authorization", "Bearer test-token");
  assert.equal(response.status, 403);
});

test("GET /api/delivery/couriers is public", async () => {
  const response = await request(app).get("/api/delivery/couriers");
  assert.equal(response.status, 200);
});
