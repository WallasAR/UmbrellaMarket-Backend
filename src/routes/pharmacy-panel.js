import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import resolveUserPharmacy from "../middlewares/pharmacyMiddleware.js";
import {
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

const router = express.Router();

router.use(autenticateToken, requireRole("admin", "operator", "pharmacist"), resolveUserPharmacy);

router.get("/dashboard", dashboard);
router.get("/products", products);
router.get("/batches", batches);
router.post("/batches", addBatch);
router.put("/batches/:id", editBatch);
router.delete("/batches/:id", removeBatch);
router.get("/alerts", alerts);
router.post("/alerts/scan", scanAlerts);
router.get("/orders", orders);
router.patch("/orders/:sessionId/status", setOrderStatus);
router.patch("/status", setOperationalStatus);

export default router;
