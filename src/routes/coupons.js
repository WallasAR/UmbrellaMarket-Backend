import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { couponValidateSchema } from "../schemas/index.js";
import { validate } from "../controllers/couponController.js";

const router = express.Router();

router.post("/validate", autenticateToken, validateBody(couponValidateSchema), validate);

export default router;
