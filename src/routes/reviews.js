import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { listReviews, addReview } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/product/:medicineId", listReviews);
router.post("/", autenticateToken, addReview);

export default router;
