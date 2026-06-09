import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { list, markRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", autenticateToken, list);
router.patch("/:id/read", autenticateToken, markRead);

export default router;
