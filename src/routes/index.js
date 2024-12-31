import express from "express";

import productRoutes from "./medicine.js";
import cartRoutes from "./cart.js";
import authRoutes from "./auth.js";
import userRoutes from "./user.js";
import paymentRoutes from "./checkout.js"

const router = express.Router();

router.use("/product", productRoutes);
router.use("/cart", cartRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/checkout", paymentRoutes);

export default router;