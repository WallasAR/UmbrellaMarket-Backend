import express from "express";
import { completeInvite } from "../controllers/onboardingController.js";
import { validateBody } from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.post("/complete-invite", completeInvite);

export default router;
