import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  pass: z.string().min(6, "Password must have at least 6 characters")
});

const registerSchema = loginSchema;

const pharmacyRegisterSchema = z.object({
  name: z.string().min(2, "Name is required"),
  cnpj: z.string().min(11, "CNPJ is required"),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  cep: z.string().min(8, "CEP is required"),
  phone: z.string().min(8, "Phone is required"),
  plan_tier: z.enum(["free", "pro", "enterprise"]).optional()
});

const batchSchema = z.object({
  medicine_id: z.coerce.number().int().positive(),
  batch_number: z.string().min(1, "Batch number is required"),
  quantity: z.coerce.number().int().nonnegative(),
  expiry_date: z.string().min(8, "Expiry date is required")
});

const planCheckoutSchema = z.object({
  plan_tier: z.enum(["free", "pro", "enterprise"])
});

const orderStatusSchema = z.object({
  order_status: z.enum(["pending_payment", "processing", "shipped", "delivered", "cancelled"])
});

const operationalStatusSchema = z.object({
  operational_status: z.enum(["open", "closed", "out_of_area"])
});

export {
  loginSchema,
  registerSchema,
  pharmacyRegisterSchema,
  batchSchema,
  planCheckoutSchema,
  orderStatusSchema,
  operationalStatusSchema
};
