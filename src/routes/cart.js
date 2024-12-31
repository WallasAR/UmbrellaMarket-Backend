import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";

import { 
  listCart, 
  addToCart, 
  updateCart, 
  removeFromCart
} from "../controllers/cartController.js";

const router = express.Router();

// Endpoints
router.get("/list", authenticateToken, listCart);
router.post("/add", authenticateToken, addToCart);
router.put("/update", authenticateToken, updateCart);
router.delete("/delete/:id", authenticateToken, removeFromCart);

// ===================================

export default router;
