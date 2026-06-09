import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { listSubscriptions, subscribe, cancel } from "../controllers/subscriptionController.js";

const router = express.Router();

router.get("/", autenticateToken, listSubscriptions);
router.post("/medicine/:medicineId", autenticateToken, subscribe);
router.delete("/:id", autenticateToken, cancel);

export default router;
