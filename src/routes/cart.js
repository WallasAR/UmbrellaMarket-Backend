import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { cartItemSchema } from "../schemas/index.js";
import { 
  listCart, 
  addToCart, 
  updateCart, 
  removeFromCart
} from "../controllers/cartController.js";

const router = express.Router();

router.get("/list", authenticateToken, listCart);
router.post("/add", authenticateToken, validateBody(cartItemSchema), addToCart);
router.put("/update", authenticateToken, validateBody(cartItemSchema), updateCart);
router.delete("/delete/:id", authenticateToken, removeFromCart);

// ===================================

export default router;
