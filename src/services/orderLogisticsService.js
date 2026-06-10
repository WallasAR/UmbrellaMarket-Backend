import sdb from "./database.js";
import { createDeliveryForOrder } from "./deliveryService.js";
import { createPickupForOrder } from "./pickupService.js";

const fulfillOrderLogistics = async ({
  purchaseId,
  userId,
  pharmacyId,
  fulfillmentMode = "delivery",
  deliveryFee = 0,
  etaMinutes = 60,
  courier = "local",
  destinationAddress,
  destLat,
  destLng
}) => {
  if (fulfillmentMode === "pickup" && pharmacyId) {
    await createPickupForOrder({ purchaseId, userId, pharmacyId });
    return;
  }

  if (fulfillmentMode === "delivery" && pharmacyId) {
    await createDeliveryForOrder({
      purchaseId,
      userId,
      pharmacyId,
      quotedPrice: Number(deliveryFee || 0),
      etaMinutes: Number(etaMinutes || 60),
      courier: courier || "local",
      destinationAddress,
      destLat: destLat != null ? Number(destLat) : null,
      destLng: destLng != null ? Number(destLng) : null
    });
  }
};

export { fulfillOrderLogistics };
