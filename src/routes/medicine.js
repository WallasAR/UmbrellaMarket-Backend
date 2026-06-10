import express from "express";
import { getProducts, getProduct, getCategories, getAlternatives, getSponsored } from "../controllers/medicineController.js";

const router = express.Router();

router.get("/list", getProducts);
router.get("/sponsored", getSponsored);
router.get("/categories", getCategories);
router.get("/:id/alternatives", getAlternatives);
router.get("/:id", getProduct);

export default router;
