import { listFavorites, addFavorite, removeFavorite } from "../services/favoriteService.js";

export const getFavoritesHandler = async (req, res, next) => {
  try {
    const favorites = await listFavorites(req.user.id);
    res.json(favorites);
  } catch (error) {
    next(error);
  }
};

export const addFavoriteHandler = async (req, res, next) => {
  try {
    const { id: medicineId } = req.params;
    const result = await addFavorite(req.user.id, medicineId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const removeFavoriteHandler = async (req, res, next) => {
  try {
    const { id: medicineId } = req.params;
    const result = await removeFavorite(req.user.id, medicineId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
