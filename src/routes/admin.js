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
router.get("/users", users);
router.patch("/users/:id/role", validateBody(roleUpdateSchema), setUserRole);
router.get("/orders", orders);
router.patch("/orders/:sessionId/status", validateBody(orderStatusSchema), setOrderStatus);
router.get("/coupons", coupons);
router.post("/coupons", validateBody(couponCreateSchema), addCoupon);
router.post("/pharmacies", addPharmacy);
router.get("/pharmacies/pending", pending);
router.patch("/pharmacies/:id/approve", approve);
router.patch("/pharmacies/:id/reject", validateBody(pharmacyRejectSchema), reject);

router.get("/metrics", async (req, res, next) => {
  try {
    const data = await getPlatformMetrics(req.query.period || "30d");
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/financial", async (req, res, next) => {
  try {
    const data = await getPlatformFinancials(req.query.period || "30d");
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/financial/export", async (req, res, next) => {
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
