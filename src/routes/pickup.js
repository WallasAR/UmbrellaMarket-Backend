import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { getPickup } from "../controllers/pickupController.js";

const router = express.Router();

router.get("/:purchaseId", autenticateToken, getPickup);

export default router;
