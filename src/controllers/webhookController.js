import { handleStripeWebhook } from "../services/checkoutService.js";

const stripeWebhook = async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    const result = await handleStripeWebhook(req.body, signature);
    res.status(200).json(result);
  } catch (error) {
    console.error("[stripe webhook]", error.message);
    res.status(400).json({ message: error.message });
  }
};

export { stripeWebhook };
