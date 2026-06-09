import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import { plans, status, register } from "../controllers/onboardingController.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { pharmacyRegisterSchema } from "../schemas/index.js";

const router = express.Router();

router.get("/plans", plans);
router.get("/status", autenticateToken, status);
router.post("/register", autenticateToken, validateBody(pharmacyRegisterSchema), register);

export default router;
