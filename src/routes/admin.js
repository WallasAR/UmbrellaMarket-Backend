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

const router = express.Router();

router.use(autenticateToken, requireRole("admin", "operator"));

router.get("/dashboard", dashboard);
router.post("/products", createMedicine);
router.put("/products/:id", updateMedicine);
router.delete("/products/:id", removeMedicine);
router.get("/users", users);
router.patch("/users/:id/role", setUserRole);
router.get("/orders", orders);
router.patch("/orders/:sessionId/status", setOrderStatus);
router.get("/coupons", coupons);
router.post("/coupons", addCoupon);
router.post("/pharmacies", addPharmacy);

export default router;
