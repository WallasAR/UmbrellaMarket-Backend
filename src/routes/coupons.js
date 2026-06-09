import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { validate } from "../controllers/couponController.js";

const router = express.Router();

router.post("/validate", autenticateToken, validate);

export default router;
