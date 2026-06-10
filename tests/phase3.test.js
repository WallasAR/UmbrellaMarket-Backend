import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp } from "./helpers.js";
import { listSymptoms, resolveSymptomTerms } from "../src/data/symptomMap.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("listSymptoms returns known symptoms", () => {
  const symptoms = listSymptoms();
  assert.ok(symptoms.length >= 5);
  assert.ok(symptoms.some((item) => item.id === "febre"));
});

test("resolveSymptomTerms maps febre to search terms", () => {
  const terms = resolveSymptomTerms("febre");
  assert.ok(terms.includes("paracetamol"));
});

test("GET /api/symptoms returns symptom catalog", async () => {
  const response = await request(app).get("/api/symptoms");
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
});

test("GET /api/symptoms/search without q returns 400", async () => {
  const response = await request(app).get("/api/symptoms/search");
  assert.equal(response.status, 400);
});

test("POST /api/copilot/chat without token returns 401", async () => {
  const response = await request(app)
    .post("/api/copilot/chat")
    .send({ message: "tenho febre" });
  assert.equal(response.status, 401);
});
