import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { listOrders, listGroups, getOrder } from "../controllers/orderController.js";

const router = express.Router();

router.get("/groups", autenticateToken, listGroups);
router.get("/", autenticateToken, listOrders);
router.get("/:sessionId", autenticateToken, getOrder);

export default router;
