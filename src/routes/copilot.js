import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { copilotChatSchema, prescriptionScanSchema } from "../schemas/index.js";
import { postChat, postPrescriptionScan } from "../controllers/copilotController.js";

const router = express.Router();

router.post("/chat", autenticateToken, validateBody(copilotChatSchema), postChat);
router.post("/prescription-scan", autenticateToken, validateBody(prescriptionScanSchema), postPrescriptionScan);

export default router;
