import { test } from "node:test";
import assert from "node:assert/strict";
import { haversineKm } from "../src/utils/geo.js";

test("haversineKm returns 0 for same coordinates", () => {
  assert.equal(haversineKm(-5.0892, -42.8019, -5.0892, -42.8019), 0);
});

test("haversineKm calculates distance between two points", () => {
  const distance = haversineKm(-5.0892, -42.8019, -5.0942, -42.8119);
  assert.ok(distance > 1 && distance < 2);
});
