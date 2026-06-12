import { Router } from "express";
import { getPublicLayout, forceRestorePreset } from "../controllers/layoutController.js";

const router = Router();

router.get("/public", getPublicLayout);
router.get("/force-restore", forceRestorePreset);

export default router;
