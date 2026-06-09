import { test, before } from "node:test";
import assert from "node:assert/strict";

let escapeCsv;

before(async () => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://example.supabase.co";
  process.env.SUPABASE_API_KEY = process.env.SUPABASE_API_KEY || "test-key";
  ({ escapeCsv } = await import("../src/services/financialService.js"));
});

test("escapeCsv returns plain values unchanged", () => {
  assert.equal(escapeCsv("Farmácia Central"), "Farmácia Central");
  assert.equal(escapeCsv(1540.5), "1540.5");
});

test("escapeCsv quotes values with commas", () => {
  assert.equal(escapeCsv("São Paulo, SP"), '"São Paulo, SP"');
});

test("escapeCsv escapes double quotes", () => {
  assert.equal(escapeCsv('Nome "Especial"'), '"Nome ""Especial"""');
});
