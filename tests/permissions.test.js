import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp, signTestToken } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("GET /api/pharmacy/products as operator without pharmacy returns 403", async () => {
  const token = signTestToken({ role: "operator" });
  const response = await request(app)
    .get("/api/pharmacy/products")
    .set("Authorization", token);

  assert.equal(response.status, 403);
});

test("GET /api/pharmacy/billing as pharmacist without owner returns 403", async () => {
  const token = signTestToken({ role: "pharmacist" });
  const response = await request(app)
    .get("/api/pharmacy/billing")
    .set("Authorization", token);

  assert.equal(response.status, 403);
});

test("PATCH /api/admin/users/:id/role as operator returns 403", async () => {
  const token = signTestToken({ role: "operator" });
  const response = await request(app)
    .patch("/api/admin/users/some-user-id/role")
    .set("Authorization", token)
    .send({ role: "customer" });

  assert.equal(response.status, 403);
});

test("GET /api/prescriptions/pending as operator returns 403", async () => {
  const token = signTestToken({ role: "operator" });
  const response = await request(app)
    .get("/api/prescriptions/pending")
    .set("Authorization", token);

  assert.equal(response.status, 403);
});

test("GET /api/pharmacies/nearby without coordinates returns 400", async () => {
  const response = await request(app).get("/api/pharmacies/nearby");

  assert.ok(response.status >= 400);
});
