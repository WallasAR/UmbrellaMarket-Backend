import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { loadTestApp } from "./helpers.js";

let app;

before(async () => {
  app = await loadTestApp();
});

test("GET /docs redirects to Swagger UI", async () => {
  const response = await request(app).get("/docs");

  assert.equal(response.status, 301);
  assert.equal(response.headers.location, "/docs/");
});

test("GET /docs/ serves Swagger UI", async () => {
  const response = await request(app).get("/docs/");

  assert.equal(response.status, 200);
  assert.match(response.text, /swagger/i);
});
