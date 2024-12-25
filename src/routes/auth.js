import express from "express";
import { signIn, register } from "../controllers/authController.js";

const router = express.Router();

// Endpoinsts
router.post("/login", signIn);
router.post("/register", register);

// ===================================

export default router;