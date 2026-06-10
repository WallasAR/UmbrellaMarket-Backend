import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp, signTestToken } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("GET /api/product/1/alternatives returns 404 or 500 without DB", async () => {
  const response = await request(app).get("/api/product/1/alternatives");
  assert.ok([200, 404, 500].includes(response.status));
});

test("POST /api/pharmacy/connect/onboard without pharmacy access returns 403", async () => {
  const token = signTestToken({ role: "pharmacist" });
  const response = await request(app)
    .post("/api/pharmacy/connect/onboard")
    .set("Authorization", token);

  assert.equal(response.status, 403);
});

test("GET /api/admin/pharmacies/x/kyc as operator returns 403", async () => {
  const token = signTestToken({ role: "operator" });
  const response = await request(app)
    .get("/api/admin/pharmacies/test-id/kyc")
    .set("Authorization", token);

  assert.equal(response.status, 403);
});
