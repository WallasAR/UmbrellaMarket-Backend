import express from "express";
import { cartCheckout, itemCheckout, PaymentSuccess } from "../controllers/checkoutController.js";
import autenticateToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// Endpoints
router.post("/cart", autenticateToken, cartCheckout);
router.post("/item/:id", autenticateToken, itemCheckout);
router.get("/success", autenticateToken, PaymentSuccess);
// ===================================

export default router;