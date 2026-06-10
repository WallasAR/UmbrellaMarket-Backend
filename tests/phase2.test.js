import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp, signTestToken } from "./helpers.js";
import { estimateLocalDelivery } from "../src/services/courierService.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("estimateLocalDelivery returns price and eta", () => {
  const quote = estimateLocalDelivery({
    originLat: -5.0892,
    originLng: -42.8019,
    destLat: -5.0942,
    destLng: -42.8119
  });
  assert.ok(quote.price > 0);
  assert.ok(quote.eta_minutes >= 30);
});

test("POST /api/delivery/quote without token returns 401", async () => {
  const response = await request(app)
    .post("/api/delivery/quote")
    .send({ pharmacy_ids: [], destination_lat: -5, destination_lng: -42 });

  assert.equal(response.status, 401);
});

test("GET /api/price-alerts without token returns 401", async () => {
  const response = await request(app).get("/api/price-alerts");
  assert.equal(response.status, 401);
});
