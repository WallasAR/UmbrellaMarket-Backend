import express from "express";

import productRoutes from "./medicine.js";
import cartRoutes from "./cart.js";
import authRoutes from "./auth.js";
import userRoutes from "./user.js";
import paymentRoutes from "./checkout.js";
import orderRoutes from "./orders.js";
import prescriptionRoutes from "./prescriptions.js";
import couponRoutes from "./coupons.js";
import pharmacyRoutes from "./pharmacies.js";
import notificationRoutes from "./notifications.js";
import adminRoutes from "./admin.js";
import reviewRoutes from "./reviews.js";
import subscriptionRoutes from "./subscriptions.js";
import pharmacyPanelRoutes from "./pharmacy-panel.js";
import onboardingRoutes from "./onboarding.js";
import deliveryRoutes from "./delivery.js";
import pickupRoutes from "./pickup.js";
import priceAlertRoutes from "./price-alerts.js";

const router = express.Router();

router.use("/product", productRoutes);
router.use("/cart", cartRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/checkout", paymentRoutes);
router.use("/orders", orderRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/coupons", couponRoutes);
router.use("/pharmacies", pharmacyRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);
router.use("/reviews", reviewRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/pharmacy", pharmacyPanelRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/delivery", deliveryRoutes);
router.use("/pickup", pickupRoutes);
router.use("/price-alerts", priceAlertRoutes);

export default router;
