import { Router } from "express";
import { getPublicLayout } from "../controllers/layoutController.js";

const router = Router();

router.get("/public", getPublicLayout);

export default router;
