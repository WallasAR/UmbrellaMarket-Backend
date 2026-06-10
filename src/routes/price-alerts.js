import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { priceAlertSchema } from "../schemas/index.js";
import { create, list, remove, scan } from "../controllers/priceAlertController.js";

const router = express.Router();

router.get("/", autenticateToken, list);
router.post("/", autenticateToken, validateBody(priceAlertSchema), create);
router.delete("/:id", autenticateToken, remove);
router.post("/scan", autenticateToken, requireRole("admin"), scan);

export default router;
