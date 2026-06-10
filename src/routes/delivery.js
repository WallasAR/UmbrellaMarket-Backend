import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { deliveryQuoteSchema } from "../schemas/index.js";
import { quote, track, listCouriers } from "../controllers/deliveryController.js";

const router = express.Router();

router.get("/couriers", listCouriers);
router.post("/quote", autenticateToken, validateBody(deliveryQuoteSchema), quote);
router.get("/track/:purchaseId", autenticateToken, track);

export default router;
