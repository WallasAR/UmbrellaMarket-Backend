import express from "express";
import { cartCheckout, itemCheckout } from "../controllers/checkoutController.js";
import autenticateToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// Endpoints
router.post("/cart", autenticateToken, cartCheckout);
router.post("/item/:id", autenticateToken, itemCheckout);

// ===================================

export default router;