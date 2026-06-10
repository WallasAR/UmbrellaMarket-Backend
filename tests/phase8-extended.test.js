import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp } from "./helpers.js";
import { estimateLocalDelivery } from "../src/utils/deliveryPricing.js";
import { getAvailableCouriers } from "../src/services/courierService.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("estimateLocalDelivery returns price and eta", () => {
  const quote = estimateLocalDelivery({
    originLat: -5.0892,
    originLng: -42.8019,
    destLat: -5.095,
    destLng: -42.81
  });
  assert.ok(quote.price > 0);
  assert.ok(quote.eta_minutes >= 30);
});

test("getAvailableCouriers includes uber and 99", () => {
  const couriers = getAvailableCouriers();
  assert.ok(couriers.some((c) => c.id === "uber"));
  assert.ok(couriers.some((c) => c.id === "99"));
});

test("GET /api/pharmacy/team as customer returns 403", async () => {
  const response = await request(app)
    .get("/api/pharmacy/team")
    .set("Authorization", "Bearer test-token");
  assert.equal(response.status, 403);
});

test("POST /api/copilot/chat without token returns 401", async () => {
  const response = await request(app)
    .post("/api/copilot/chat")
    .send({ message: "tenho febre" });
  assert.equal(response.status, 401);
});
