import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import {
  createPrescription,
  listPrescriptions,
  listPending,
  review
} from "../controllers/prescriptionController.js";

const router = express.Router();

router.post("/", autenticateToken, createPrescription);
router.get("/", autenticateToken, listPrescriptions);
router.get("/pending", autenticateToken, requireRole("admin", "pharmacist"), listPending);
router.patch("/:id/review", autenticateToken, requireRole("admin", "pharmacist"), review);

export default router;
