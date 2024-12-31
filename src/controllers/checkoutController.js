import { cartCheckoutSession, itemCheckoutSession, updatePaymentStatus } from "../services/checkoutService.js";

const cartCheckout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    if (!userId) throw new Error("User not found");

    const session = await cartCheckoutSession(userId)

    res.status(200).json({ url: session });
  } catch (error) {
    next(error);
  };
};
const itemCheckout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.id);
    const { quantity } = req.body;

    if (!userId) throw new Error("User not found");

    const session = await itemCheckoutSession(userId, productId, quantity);

    res.status(200).json({ url: session });
  } catch (error) {
    next(error);
  };
};

const PaymentSuccess = async (req, res, next) => {
    try {
      const { sessionId } = req.query;

      if (!sessionId) throw new Error("Session ID not provided");

      const status = await updatePaymentStatus(sessionId);

      res.status(200).json({ status });
    } catch (error) {
      next(error);
    };
};

export { cartCheckout, itemCheckout, PaymentSuccess };