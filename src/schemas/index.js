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

const cartItemSchema = z.object({
  medicine_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive()
});

const checkoutCartSchema = z.object({
  couponCode: z.string().optional()
});

const checkoutItemSchema = z.object({
  quantity: z.coerce.number().int().positive().default(1),
  couponCode: z.string().optional()
});

const reviewSchema = z.object({
  medicine_id: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  pharmacy_id: z.string().uuid().optional()
});

const couponValidateSchema = z.object({
  code: z.string().min(2, "Coupon code is required"),
  subtotal: z.coerce.number().nonnegative().optional()
});

const prescriptionSchema = z.object({
  medicine_id: z.coerce.number().int().positive(),
  file_name: z.string().optional(),
  file_data: z.string().min(20, "Prescription file is required")
});

const prescriptionReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  notes: z.string().max(500).optional()
});

const userProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  cep: z.string().min(8).optional(),
  address: z.string().min(3).optional(),
  avatar: z.string().url().optional()
});

const roleUpdateSchema = z.object({
  role: z.enum(["customer", "operator", "pharmacist", "admin"])
});

const pharmacyRejectSchema = z.object({
  reason: z.string().min(3, "Rejection reason is required").optional()
});

const couponCreateSchema = z.object({
  code: z.string().min(2),
  discount_type: z.enum(["percentage", "fixed"]).default("percentage"),
  discount_value: z.coerce.number().positive(),
  min_order_value: z.coerce.number().nonnegative().optional(),
  max_uses: z.coerce.number().int().positive().optional(),
  expires_at: z.string().optional()
});

const productCreateSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().positive(),
  discount: z.coerce.number().min(0).max(100).optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  requires_prescription: z.boolean().optional(),
  allows_subscription: z.boolean().optional(),
  active_ingredient: z.string().optional(),
  laboratory: z.string().optional(),
  pharmacy_id: z.string().uuid().optional(),
  images: z.object({
    thumb_img: z.string().optional(),
    img1: z.string().optional(),
    img2: z.string().optional(),
    img3: z.string().optional()
  }).optional()
});

export {
  loginSchema,
  registerSchema,
  pharmacyRegisterSchema,
  batchSchema,
  planCheckoutSchema,
  orderStatusSchema,
  operationalStatusSchema,
  cartItemSchema,
  checkoutCartSchema,
  checkoutItemSchema,
  reviewSchema,
  couponValidateSchema,
  prescriptionSchema,
  prescriptionReviewSchema,
  userProfileSchema,
  roleUpdateSchema,
  pharmacyRejectSchema,
  couponCreateSchema,
  productCreateSchema
};
