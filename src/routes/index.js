import express from "express";

import productRoutes from "./medicine.js";
import cartRoutes from "./cart.js";
import authRoutes from "./auth.js";

const router = express.Router();

// router.use("/auth", userRoutes);
router.use("/product", productRoutes);
router.use("/cart", cartRoutes);
router.use("/auth", authRoutes);

export default router;