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
  plan_tier: z.enum(["free", "pro", "enterprise"]).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

const nearbyPharmaciesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_km: z.coerce.number().positive().max(100).optional()
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
  couponCode: z.string().optional(),
  fulfillment_mode: z.enum(["delivery", "pickup"]).optional().default("delivery"),
  destination_lat: z.coerce.number().min(-90).max(90).optional(),
  destination_lng: z.coerce.number().min(-180).max(180).optional(),
  destination_address: z.string().optional(),
  courier: z.enum(["local", "uber", "99"]).optional(),
  delivery_quotes: z.record(z.string(), z.object({
    price: z.coerce.number().nonnegative(),
    eta_minutes: z.coerce.number().int().positive().optional(),
    courier: z.string().optional()
  })).optional()
});

const checkoutItemSchema = z.object({
  quantity: z.coerce.number().int().positive().default(1),
  couponCode: z.string().optional(),
  fulfillment_mode: z.enum(["delivery", "pickup"]).optional(),
  destination_lat: z.coerce.number().min(-90).max(90).optional(),
  destination_lng: z.coerce.number().min(-180).max(180).optional(),
  destination_address: z.string().optional()
});

const deliveryQuoteSchema = z.object({
  pharmacy_ids: z.array(z.string().uuid()).min(1),
  destination_lat: z.coerce.number().min(-90).max(90),
  destination_lng: z.coerce.number().min(-180).max(180),
  courier: z.enum(["local", "uber", "99"]).optional()
});

const priceAlertSchema = z.object({
  medicine_id: z.coerce.number().int().positive(),
  target_price: z.coerce.number().positive(),
  notify_push: z.boolean().optional(),
  notify_email: z.boolean().optional()
});

const pickupConfirmSchema = z.object({
  pickup_code: z.string().min(4).max(20)
});

const copilotChatSchema = z.object({
  message: z.string().min(2).max(1000),
  session_id: z.string().uuid().optional()
});

const prescriptionScanSchema = z.object({
  text: z.string().optional(),
  file_data: z.string().optional(),
  session_id: z.string().uuid().optional()
}).refine((data) => data.text || data.file_data, {
  message: "Informe text ou file_data"
});

const prescriptionToCartSchema = z.object({
  text: z.string().optional(),
  file_data: z.string().optional(),
  items: z.array(z.object({
    medicine_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive().optional().default(1)
  })).optional()
}).refine((data) => data.items?.length || data.text || data.file_data, {
  message: "Informe items, text ou file_data"
});

const bulkCartSchema = z.object({
  items: z.array(z.object({
    medicine_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive().optional().default(1)
  })).min(1).max(30)
});

const sponsoredClickSchema = z.object({
  source: z.enum(["listing", "home", "copilot", "search"]).optional()
});

const boostCreateSchema = z.object({
  medicine_id: z.coerce.number().int().positive(),
  days: z.coerce.number().int().min(1).max(90).optional().default(7),
  priority: z.coerce.number().int().min(1).max(10).optional().default(1)
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

const kycUploadSchema = z.object({
  document_type: z.enum(["cnpj", "alvara", "crf", "other"]),
  file_name: z.string().optional(),
  file_data: z.string().min(20, "Document file is required")
});

const kycReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  notes: z.string().max(500).optional()
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
  medicine_type: z.enum(["reference", "generic"]).optional(),
  dosage: z.string().optional(),
  symptoms: z.array(z.string().min(2)).optional(),
  pharmacy_id: z.string().uuid().optional(),
  images: z.object({
    thumb_img: z.string().optional(),
    img1: z.string().optional(),
    img2: z.string().optional(),
    img3: z.string().optional()
  }).optional()
});

const productUpdateSchema = productCreateSchema.partial();

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});

const bannerFieldsSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  image_url: z.string().url().optional(),
  file_name: z.string().optional(),
  file_data: z.string().min(20).optional(),
  link_url: z.string().url().optional(),
  category: z.string().optional(),
  sponsor: z.string().optional(),
  gradient: z.string().optional(),
  priority: z.coerce.number().int().optional(),
  active: z.boolean().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional()
});

const bannerCreateSchema = bannerFieldsSchema.refine((data) => data.image_url || data.file_data, {
  message: "image_url or file_data is required"
});

const bannerUpdateSchema = bannerFieldsSchema.partial();

const staffAssignSchema = z.object({
  email: z.string().email(),
  role: z.enum(["operator", "pharmacist"])
});

const staffPermissionsSchema = z.object({
  permissions: z.array(z.string().min(2)).min(1)
});

export {
  loginSchema,
  registerSchema,
  pharmacyRegisterSchema,
  nearbyPharmaciesQuerySchema,
  kycUploadSchema,
  kycReviewSchema,
  batchSchema,
  planCheckoutSchema,
  orderStatusSchema,
  operationalStatusSchema,
  cartItemSchema,
  checkoutCartSchema,
  checkoutItemSchema,
  deliveryQuoteSchema,
  priceAlertSchema,
  pickupConfirmSchema,
  copilotChatSchema,
  prescriptionScanSchema,
  prescriptionToCartSchema,
  bulkCartSchema,
  sponsoredClickSchema,
  boostCreateSchema,
  reviewSchema,
  couponValidateSchema,
  prescriptionSchema,
  prescriptionReviewSchema,
  userProfileSchema,
  roleUpdateSchema,
  pharmacyRejectSchema,
  couponCreateSchema,
  productCreateSchema,
  productUpdateSchema,
  pushSubscriptionSchema,
  bannerCreateSchema,
  bannerUpdateSchema,
  staffAssignSchema,
  staffPermissionsSchema
};
