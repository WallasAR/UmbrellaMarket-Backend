import { getPickupByPurchase } from "../services/pickupService.js";

const getPickup = async (req, res, next) => {
  try {
    const pickup = await getPickupByPurchase(req.params.purchaseId, req.user.id);
    if (!pickup) return res.status(404).json({ message: "Pickup not found" });
    res.status(200).json(pickup);
  } catch (error) {
    next(error);
  }
};

export { getPickup };
