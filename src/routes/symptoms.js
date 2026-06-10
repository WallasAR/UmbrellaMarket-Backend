import express from "express";
import { getSymptoms, searchSymptoms } from "../controllers/symptomController.js";

const router = express.Router();

router.get("/", getSymptoms);
router.get("/search", searchSymptoms);

export default router;
