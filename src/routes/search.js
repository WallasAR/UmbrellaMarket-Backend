import { Router } from "express";
import { suggestions, history, saveHistory } from "../controllers/searchController.js";
import extractUserFromToken from "../middlewares/optionalAuthMiddleware.js";

const router = Router();

// optionalAuthMiddleware would extract req.user if token is present, else do nothing.
// Since it's public search, we don't block if not logged in.
router.get("/suggestions", extractUserFromToken, suggestions);
router.get("/history", extractUserFromToken, history);
router.post("/history", extractUserFromToken, saveHistory);

export default router;
