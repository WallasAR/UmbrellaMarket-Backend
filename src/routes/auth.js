import express from "express";
import { signIn, register, socialSignIn } from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimitMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { loginSchema, registerSchema } from "../schemas/index.js";

const router = express.Router();

router.use(authLimiter);
router.post("/login", validateBody(loginSchema), signIn);
router.post("/register", validateBody(registerSchema), register);
router.post("/social", socialSignIn);

// ===================================

export default router;