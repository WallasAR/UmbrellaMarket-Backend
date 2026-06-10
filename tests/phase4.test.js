import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp } from "./helpers.js";
import { getAvailableCouriers } from "../src/services/courierService.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("getAvailableCouriers includes local, uber and 99", () => {
  const couriers = getAvailableCouriers();
  assert.equal(couriers.length, 3);
  assert.ok(couriers.some((c) => c.id === "99"));
});

test("POST /api/cart/bulk-add without token returns 401", async () => {
  const response = await request(app)
    .post("/api/cart/bulk-add")
    .send({ items: [{ medicine_id: 1, quantity: 1 }] });
  assert.equal(response.status, 401);
});

test("GET /api/copilot/sessions without token returns 401", async () => {
  const response = await request(app).get("/api/copilot/sessions");
  assert.equal(response.status, 401);
});

test("GET /api/delivery/couriers returns courier list", async () => {
  const response = await request(app).get("/api/delivery/couriers");
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
});
