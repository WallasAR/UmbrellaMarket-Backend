import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { prescriptionSchema, prescriptionReviewSchema } from "../schemas/index.js";
import {
  createPrescription,
  listPrescriptions,
  listPrescriptionLists,
  listPending,
  review
} from "../controllers/prescriptionController.js";

const router = express.Router();

router.post("/", autenticateToken, validateBody(prescriptionSchema), createPrescription);
router.get("/lists", autenticateToken, listPrescriptionLists);
router.get("/", autenticateToken, listPrescriptions);
router.get("/pending", autenticateToken, requireRole("admin", "pharmacist"), listPending);
router.patch("/:id/review", autenticateToken, requireRole("admin", "pharmacist"), validateBody(prescriptionReviewSchema), review);

export default router;
