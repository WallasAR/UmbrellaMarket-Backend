import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { deliveryQuoteSchema } from "../schemas/index.js";
import { quote, track } from "../controllers/deliveryController.js";

const router = express.Router();

router.post("/quote", autenticateToken, validateBody(deliveryQuoteSchema), quote);
router.get("/track/:purchaseId", autenticateToken, track);

export default router;
