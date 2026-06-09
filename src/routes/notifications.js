import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { list, markRead, vapidKey, subscribePush } from "../controllers/notificationController.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { pushSubscriptionSchema } from "../schemas/index.js";

const router = express.Router();

router.get("/vapid-public-key", vapidKey);
router.get("/", autenticateToken, list);
router.post("/push-subscribe", autenticateToken, validateBody(pushSubscriptionSchema), subscribePush);
router.patch("/:id/read", autenticateToken, markRead);

export default router;
