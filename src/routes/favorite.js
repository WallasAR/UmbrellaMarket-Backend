import { Router } from "express";
import { getFavoritesHandler, addFavoriteHandler, removeFavoriteHandler } from "../controllers/favoriteController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", getFavoritesHandler);
router.post("/:id", addFavoriteHandler);
router.delete("/:id", removeFavoriteHandler);

export default router;
