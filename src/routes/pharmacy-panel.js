import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import resolveUserPharmacy from "../middlewares/pharmacyMiddleware.js";
import { requirePharmacyPermission, requirePharmacyOwner } from "../middlewares/permissionMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import {
  batchSchema,
  planCheckoutSchema,
  orderStatusSchema,
  operationalStatusSchema,
  productCreateSchema,
  productUpdateSchema,
  prescriptionReviewSchema,
  kycUploadSchema,
  pickupConfirmSchema,
  boostCreateSchema
} from "../schemas/index.js";
import { startOnboarding, getStatus } from "../controllers/connectController.js";
import { uploadDocument, listDocuments } from "../controllers/kycController.js";
import {
  billing,
  billingCheckout,
  billingPortal,
  dashboard,
  products,
  addProduct,
  editProduct,
  removeProduct,
  batches,
  addBatch,
  editBatch,
  removeBatch,
  alerts,
  scanAlerts,
  orders,
  setOrderStatus,
  setOperationalStatus,
  confirmPickupOrder,
  productPriceBenchmark,
  productPriceHistory,
  deliveries,
  advanceDelivery,
  boosts,
  addBoost,
  removeBoost,
  boostMetrics
} from "../controllers/pharmacyPanelController.js";
import { listPharmacyPending, reviewPharmacyPrescription } from "../controllers/prescriptionController.js";
import { getPharmacyFinancials, buildPharmacyFinancialCsv } from "../services/financialService.js";
import { getPharmacyMetrics } from "../services/metricsService.js";

const router = express.Router();

router.use(autenticateToken, requireRole("admin", "operator", "pharmacist"), resolveUserPharmacy);

router.get("/dashboard", requirePharmacyPermission("dashboard"), dashboard);
router.get("/orders", requirePharmacyPermission("orders"), orders);
router.patch("/orders/:sessionId/status", requirePharmacyPermission("orders"), validateBody(orderStatusSchema), setOrderStatus);

router.get("/prescriptions/pending", requirePharmacyPermission("prescriptions"), listPharmacyPending);
router.patch(
  "/prescriptions/:id/review",
  requirePharmacyPermission("prescriptions"),
  validateBody(prescriptionReviewSchema),
  reviewPharmacyPrescription
);

router.get("/products", requirePharmacyPermission("products"), products);
router.post("/products", requirePharmacyPermission("products"), validateBody(productCreateSchema), addProduct);
router.put("/products/:id", requirePharmacyPermission("products"), validateBody(productUpdateSchema), editProduct);
router.delete("/products/:id", requirePharmacyPermission("products"), removeProduct);

router.get("/batches", requirePharmacyPermission("batches"), batches);
router.post("/batches", requirePharmacyPermission("batches"), validateBody(batchSchema), addBatch);
router.put("/batches/:id", requirePharmacyPermission("batches"), editBatch);
router.delete("/batches/:id", requirePharmacyPermission("batches"), removeBatch);

router.get("/alerts", requirePharmacyPermission("alerts"), alerts);
router.post("/alerts/scan", requirePharmacyPermission("alerts"), scanAlerts);

router.patch("/status", requirePharmacyPermission("status"), validateBody(operationalStatusSchema), setOperationalStatus);

router.get("/metrics", requirePharmacyPermission("financial"), async (req, res, next) => {
  try {
    const data = await getPharmacyMetrics(req.pharmacyId, req.query.period || "30d");
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/financial", requirePharmacyPermission("financial"), async (req, res, next) => {
  try {
    const data = await getPharmacyFinancials(req.pharmacyId, req.query.period || "30d");
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/financial/export", requirePharmacyPermission("financial"), async (req, res, next) => {
  try {
    const period = req.query.period || "30d";
    const csv = await buildPharmacyFinancialCsv(req.pharmacyId, period);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="financeiro-${period}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
});

router.get("/billing", requirePharmacyOwner, billing);
router.post("/billing/checkout", requirePharmacyOwner, validateBody(planCheckoutSchema), billingCheckout);
router.post("/billing/portal", requirePharmacyOwner, billingPortal);

router.post("/connect/onboard", requirePharmacyOwner, startOnboarding);
router.get("/connect/status", requirePharmacyOwner, getStatus);

router.get("/kyc/documents", requirePharmacyOwner, listDocuments);
router.post("/kyc/documents", requirePharmacyOwner, validateBody(kycUploadSchema), uploadDocument);

router.get("/products/:id/price-benchmark", requirePharmacyPermission("financial"), productPriceBenchmark);
router.get("/products/:id/price-history", requirePharmacyPermission("financial"), productPriceHistory);
router.get("/deliveries", requirePharmacyPermission("orders"), deliveries);
router.post("/deliveries/:id/advance", requirePharmacyPermission("orders"), advanceDelivery);
router.post("/pickup/confirm", requirePharmacyPermission("orders"), validateBody(pickupConfirmSchema), confirmPickupOrder);

router.get("/boosts/metrics", requirePharmacyPermission("products"), boostMetrics);
router.get("/boosts", requirePharmacyPermission("products"), boosts);
router.post("/boosts", requirePharmacyPermission("products"), validateBody(boostCreateSchema), addBoost);
router.delete("/boosts/:id", requirePharmacyPermission("products"), removeBoost);

export default router;
