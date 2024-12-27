import { cartCheckoutSession, itemCheckoutSession } from "../services/checkoutService.js";

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

    if (!userId) throw new Error("User not found");

    const session = await itemCheckoutSession(userId, productId);

    res.status(200).json({ url: session });
  } catch (error) {
    next(error);
  };
};

export { cartCheckout, itemCheckout };