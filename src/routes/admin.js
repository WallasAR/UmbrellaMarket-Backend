import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import {
  dashboard,
  createMedicine,
  updateMedicine,
  removeMedicine,
  users,
  setUserRole,
  orders,
  setOrderStatus,
  coupons,
  addCoupon,
  addPharmacy
} from "../controllers/adminController.js";
import { pending, approve, reject } from "../controllers/onboardingController.js";
import { getPlatformFinancials, buildPlatformFinancialCsv } from "../services/financialService.js";
import { getPlatformMetrics } from "../services/metricsService.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import {
  orderStatusSchema,
  roleUpdateSchema,
  pharmacyRejectSchema,
  couponCreateSchema,
  productCreateSchema
} from "../schemas/index.js";

const router = express.Router();

router.use(autenticateToken, requireRole("admin", "operator"));

router.get("/dashboard", dashboard);
router.post("/products", validateBody(productCreateSchema), createMedicine);
router.put("/products/:id", updateMedicine);
router.delete("/products/:id", removeMedicine);
router.get("/orders", orders);
router.patch("/orders/:sessionId/status", validateBody(orderStatusSchema), setOrderStatus);
router.get("/coupons", coupons);
router.post("/coupons", validateBody(couponCreateSchema), addCoupon);

router.get("/users", requireRole("admin"), users);
router.patch("/users/:id/role", requireRole("admin"), validateBody(roleUpdateSchema), setUserRole);
router.post("/pharmacies", requireRole("admin"), addPharmacy);
router.get("/pharmacies/pending", requireRole("admin"), pending);
router.patch("/pharmacies/:id/approve", requireRole("admin"), approve);
router.patch("/pharmacies/:id/reject", requireRole("admin"), validateBody(pharmacyRejectSchema), reject);

router.get("/metrics", requireRole("admin"), async (req, res, next) => {
  try {
    const data = await getPlatformMetrics(req.query.period || "30d");
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/financial", requireRole("admin"), async (req, res, next) => {
  try {
    const data = await getPlatformFinancials(req.query.period || "30d");
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/financial/export", requireRole("admin"), async (req, res, next) => {
  try {
    const period = req.query.period || "30d";
    const csv = await buildPlatformFinancialCsv(period);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="plataforma-${period}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;
