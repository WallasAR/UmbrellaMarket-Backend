import express from "express";
import { getProducts, getProduct, getCategories } from "../controllers/medicineController.js";

const router = express.Router();

router.get("/list", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProduct);

export default router;
