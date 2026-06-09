import express from "express";
import { signIn, register } from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimitMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { loginSchema, registerSchema } from "../schemas/index.js";

const router = express.Router();

router.use(authLimiter);
router.post("/login", validateBody(loginSchema), signIn);
router.post("/register", validateBody(registerSchema), register);

// ===================================

export default router;