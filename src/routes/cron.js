import express from "express";
import verifyCronSecret from "../middlewares/cronMiddleware.js";
import { scanPriceAlerts } from "../services/priceAlertService.js";

const router = express.Router();

router.post("/price-alerts", verifyCronSecret, async (req, res, next) => {
  try {
    const result = await scanPriceAlerts();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
