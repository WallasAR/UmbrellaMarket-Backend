import { cartCheckoutSession, itemCheckoutSession, updatePaymentStatus } from "../services/checkoutService.js";

const cartCheckout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) throw new Error("User not found");
    const result = await cartCheckoutSession(userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const itemCheckout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.id);
    const { quantity, couponCode } = req.body;
    if (!userId) throw new Error("User not found");
    const result = await itemCheckoutSession(userId, productId, quantity, couponCode);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const PaymentSuccess = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) throw new Error("Session ID not provided");
    const status = await updatePaymentStatus(sessionId);
    res.status(200).json({ status });
  } catch (error) {
    next(error);
  }
};

export { cartCheckout, itemCheckout, PaymentSuccess };
