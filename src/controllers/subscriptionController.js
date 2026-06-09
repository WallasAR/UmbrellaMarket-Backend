import {
  listUserSubscriptions,
  createSubscriptionCheckout,
  cancelSubscription
} from "../services/subscriptionService.js";

const listSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await listUserSubscriptions(req.user.id);
    res.status(200).json(subscriptions);
  } catch (error) {
    next(error);
  }
};

const subscribe = async (req, res, next) => {
  try {
    const medicineId = Number(req.params.medicineId);
    const { quantity } = req.body;
    const url = await createSubscriptionCheckout(req.user.id, medicineId, quantity || 1);
    res.status(200).json({ url });
  } catch (error) {
    next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    await cancelSubscription(req.user.id, req.params.id);
    res.status(200).json({ message: "Subscription cancelled" });
  } catch (error) {
    next(error);
  }
};

export { listSubscriptions, subscribe, cancel };
