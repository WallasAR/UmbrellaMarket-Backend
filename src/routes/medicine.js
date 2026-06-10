import express from "express";
import autenticateToken from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateMiddleware.js";
import { sponsoredClickSchema } from "../schemas/index.js";
import {
  getProducts,
  getProduct,
  getCategories,
  getAlternatives,
  getSponsored,
  postSponsoredClick
} from "../controllers/medicineController.js";

const router = express.Router();

router.get("/list", getProducts);
router.get("/sponsored", getSponsored);
router.get("/categories", getCategories);
router.post("/:id/sponsored-click", autenticateToken, validateBody(sponsoredClickSchema), postSponsoredClick);
router.get("/:id/alternatives", getAlternatives);
router.get("/:id", getProduct);

export default router;
