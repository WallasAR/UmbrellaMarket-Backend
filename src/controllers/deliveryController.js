import { quoteDeliveries, getDeliveryByPurchase } from "../services/deliveryService.js";
import { getAvailableCouriers } from "../services/courierService.js";

const quote = async (req, res, next) => {
  try {
    const { pharmacy_ids, destination_lat, destination_lng, courier } = req.body;
    const quotes = await quoteDeliveries({
      pharmacyIds: pharmacy_ids,
      destLat: destination_lat,
      destLng: destination_lng,
      courier: courier || "local"
    });
    res.status(200).json(quotes);
  } catch (error) {
    next(error);
  }
};

const track = async (req, res, next) => {
  try {
    const delivery = await getDeliveryByPurchase(req.params.purchaseId, req.user.id);
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });
    res.status(200).json(delivery);
  } catch (error) {
    next(error);
  }
};

const listCouriers = async (_req, res, next) => {
  try {
    res.status(200).json(getAvailableCouriers());
  } catch (error) {
    next(error);
  }
};

export { quote, track, listCouriers };
