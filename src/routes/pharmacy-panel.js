import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import resolveUserPharmacy from "../middlewares/pharmacyMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { batchSchema, planCheckoutSchema, orderStatusSchema, operationalStatusSchema } from "../schemas/index.js";
import {
  billing,
  billingCheckout,
  billingPortal,
  dashboard,
  products,
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
import { getPharmacyFinancials } from "../services/financialService.js";

const router = express.Router();

router.use(autenticateToken, requireRole("admin", "operator", "pharmacist"), resolveUserPharmacy);

router.get("/dashboard", dashboard);
router.get("/billing", billing);
router.post("/billing/checkout", validateBody(planCheckoutSchema), billingCheckout);
router.post("/billing/portal", billingPortal);
router.get("/products", products);
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

export default router;
