import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import resolveUserPharmacy from "../middlewares/pharmacyMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { batchSchema, planCheckoutSchema, orderStatusSchema, operationalStatusSchema, productCreateSchema, productUpdateSchema } from "../schemas/index.js";
import {
  billing,
  billingCheckout,
  billingPortal,
  dashboard,
  products,
  addProduct,
  editProduct,
  batches,
  addBatch,
  editBatch,
  removeBatch,
  alerts,
  scanAlerts,
  orders,
  setOrderStatus,
  setOperationalStatus
} from "../controllers/pharmacyPanelController.js";
import { getPharmacyFinancials, buildPharmacyFinancialCsv } from "../services/financialService.js";

const router = express.Router();

router.use(autenticateToken, requireRole("admin", "operator", "pharmacist"), resolveUserPharmacy);

router.get("/dashboard", dashboard);
router.get("/billing", billing);
router.post("/billing/checkout", validateBody(planCheckoutSchema), billingCheckout);
router.post("/billing/portal", billingPortal);
router.get("/products", products);
router.post("/products", validateBody(productCreateSchema), addProduct);
router.put("/products/:id", validateBody(productUpdateSchema), editProduct);
router.get("/batches", batches);
router.post("/batches", validateBody(batchSchema), addBatch);
router.put("/batches/:id", editBatch);
router.delete("/batches/:id", removeBatch);
router.get("/alerts", alerts);
router.post("/alerts/scan", scanAlerts);
router.get("/orders", orders);
router.patch("/orders/:sessionId/status", validateBody(orderStatusSchema), setOrderStatus);
router.patch("/status", validateBody(operationalStatusSchema), setOperationalStatus);

router.get("/financial", async (req, res, next) => {
  try {
    const data = await getPharmacyFinancials(req.pharmacyId, req.query.period || "30d");
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/financial/export", async (req, res, next) => {
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

export default router;
