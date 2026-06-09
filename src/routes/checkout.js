import express from "express";
import { cartCheckout, itemCheckout, PaymentSuccess } from "../controllers/checkoutController.js";
import autenticateToken from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { checkoutCartSchema, checkoutItemSchema } from "../schemas/index.js";

const router = express.Router();

router.post("/cart", autenticateToken, validateBody(checkoutCartSchema), cartCheckout);
router.post("/item/:id", autenticateToken, validateBody(checkoutItemSchema), itemCheckout);
router.get("/success", autenticateToken, PaymentSuccess);
// ===================================

export default router;