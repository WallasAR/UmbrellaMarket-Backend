import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { getProfile, updateProfile } from "../controllers/userController.js"

const router = express.Router();

// Endpoints
router.get("/profile", autenticateToken, getProfile);
router.put("/edit", autenticateToken, updateProfile);

// ===================================

export default router;