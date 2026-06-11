import express from "express";
import { list, getById, nearby, resolveDomain } from "../controllers/pharmacyController.js";
import { validateQuery } from "../middlewares/validateMiddleware.js";
import { nearbyPharmaciesQuerySchema } from "../schemas/index.js";

const router = express.Router();

router.get("/resolve-domain", resolveDomain);
router.get("/nearby", validateQuery(nearbyPharmaciesQuerySchema), nearby);
router.get("/", list);
router.get("/:id", getById);

export default router;
