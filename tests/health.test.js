import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("GET /health returns ok", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.ok(response.body.timestamp);
});

test("GET / returns server online", async () => {
  const response = await request(app).get("/");

  assert.equal(response.status, 200);
  assert.match(response.text, /online/i);
});
