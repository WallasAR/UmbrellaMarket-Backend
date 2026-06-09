import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { reviewSchema } from "../schemas/index.js";
import { listReviews, addReview } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/product/:medicineId", listReviews);
router.post("/", autenticateToken, validateBody(reviewSchema), addReview);

export default router;
