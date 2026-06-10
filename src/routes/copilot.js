import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import {
  copilotChatSchema,
  prescriptionScanSchema,
  prescriptionToCartSchema
} from "../schemas/index.js";
import {
  postChat,
  postPrescriptionScan,
  postPrescriptionToCart,
  getSessions,
  getSessionMessages
} from "../controllers/copilotController.js";

const router = express.Router();

router.get("/sessions", autenticateToken, getSessions);
router.get("/sessions/:id/messages", autenticateToken, getSessionMessages);
router.post("/chat", autenticateToken, validateBody(copilotChatSchema), postChat);
router.post("/prescription-scan", autenticateToken, validateBody(prescriptionScanSchema), postPrescriptionScan);
router.post("/prescription-to-cart", autenticateToken, validateBody(prescriptionToCartSchema), postPrescriptionToCart);

export default router;
