import { Router } from "express";
import { getFavoritesHandler, addFavoriteHandler, removeFavoriteHandler } from "../controllers/favoriteController.js";
import authenticateToken from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticateToken);
router.get("/", getFavoritesHandler);
router.post("/:id", addFavoriteHandler);
router.delete("/:id", removeFavoriteHandler);

export default router;
