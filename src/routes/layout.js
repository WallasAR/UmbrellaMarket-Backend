import { Router } from "express";
import { getPublicLayout, getFactoryTemplate, forceRestorePreset } from "../controllers/layoutController.js";

const router = Router();

router.get("/public", getPublicLayout);
router.get("/factory-template", getFactoryTemplate);
router.post("/force-restore", forceRestorePreset);

export default router;
