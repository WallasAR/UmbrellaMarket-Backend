import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp, signTestToken } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("POST /api/prescriptions without token returns 401", async () => {
  const response = await request(app)
    .post("/api/prescriptions")
    .send({
      medicine_id: 1,
      file_data: "base64encodedprescriptioncontent"
    });

  assert.equal(response.status, 401);
});

test("POST /api/prescriptions with invalid body returns 400", async () => {
  const token = signTestToken();
  const response = await request(app)
    .post("/api/prescriptions")
    .set("Authorization", token)
    .send({ medicine_id: 1, file_data: "short" });

  assert.equal(response.status, 400);
});

test("GET /api/prescriptions/pending without token returns 401", async () => {
  const response = await request(app).get("/api/prescriptions/pending");

  assert.equal(response.status, 401);
});
