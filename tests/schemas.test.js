import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loginSchema,
  orderStatusSchema,
  pushSubscriptionSchema,
  productCreateSchema,
  couponValidateSchema,
  prescriptionSchema
} from "../src/schemas/index.js";

test("loginSchema accepts valid credentials", () => {
  const result = loginSchema.safeParse({ email: "user@test.com", pass: "secret1" });
  assert.equal(result.success, true);
});

test("loginSchema rejects short password", () => {
  const result = loginSchema.safeParse({ email: "user@test.com", pass: "123" });
  assert.equal(result.success, false);
});

test("orderStatusSchema accepts processing status", () => {
  const result = orderStatusSchema.safeParse({ order_status: "processing" });
  assert.equal(result.success, true);
});

test("orderStatusSchema rejects unknown status", () => {
  const result = orderStatusSchema.safeParse({ order_status: "invalid" });
  assert.equal(result.success, false);
});

test("productCreateSchema coerces numeric fields", () => {
  const result = productCreateSchema.safeParse({
    name: "Dipirona",
    price: "12.5",
    stock: "10"
  });

  assert.equal(result.success, true);
  assert.equal(result.data.price, 12.5);
  assert.equal(result.data.stock, 10);
});

test("pushSubscriptionSchema requires endpoint and keys", () => {
  const valid = pushSubscriptionSchema.safeParse({
    endpoint: "https://push.example.com/sub",
    keys: { p256dh: "key", auth: "auth" }
  });
  const invalid = pushSubscriptionSchema.safeParse({ endpoint: "not-a-url" });

  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});

test("couponValidateSchema accepts code and coerces subtotal", () => {
  const result = couponValidateSchema.safeParse({ code: "UMBRELLA10", subtotal: "99.5" });

  assert.equal(result.success, true);
  assert.equal(result.data.subtotal, 99.5);
});

test("prescriptionSchema requires medicine_id and file_data", () => {
  const valid = prescriptionSchema.safeParse({
    medicine_id: 1,
    file_data: "base64encodedcontenthere123456"
  });
  const invalid = prescriptionSchema.safeParse({ medicine_id: 1, file_data: "short" });

  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});
