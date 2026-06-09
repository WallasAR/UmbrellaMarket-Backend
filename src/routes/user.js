import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { userProfileSchema } from "../schemas/index.js";
import { getProfile, updateProfile } from "../controllers/userController.js"

const router = express.Router();

router.get("/profile", autenticateToken, getProfile);
router.put("/edit", autenticateToken, validateBody(userProfileSchema), updateProfile);

// ===================================

export default router;