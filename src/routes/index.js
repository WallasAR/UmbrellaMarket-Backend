import express from "express";

// import { userRoutes } from "./auth.js";
import productRoutes from "./medicine.js";
import cartRoutes from "./cart.js";

const router = express.Router();

// router.use("/auth", userRoutes);
router.use("/product", productRoutes);
router.use("/cart", cartRoutes);

export default router;