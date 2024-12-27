import sdb from "./database.js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_KEY);

const cartCheckoutSession = async (userId) => {
  const { data, error } = await sdb
  .from("Cart")
  .select(`quantity,
    Medicine(name, price)`)
  .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  };

  const lineItems = data.map((item) => ({
    price_data: {
      currency: "brl",
      product_data: {
        name: item.Medicine.name,
      },
      unit_amount: Math.round(item.Medicine.price * 100),
    },
    quantity: item.quantity, 
  }));
  

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: process.env.SUCCESS_URL,
    cancel_url: process.env.CANCEL_URL,
  });

  return session.url;
};

const itemCheckoutSession = async (userId, productId) => {
  const { data, error } = await sdb
  .from("Cart")
  .select(`quantity, Medicine(name, price)`)
  .eq("user_id", userId)
  .eq("medicine_id", productId)
  .single();

  if (error) {
    throw new Error(error.message);
  };

  const item = [{
    price_data: {
      currency: "brl",
      product_data: {
        name: data.Medicine.name,
      },
      unit_amount: Math.round(data.Medicine.price * 100),
    },
    quantity: data.quantity, 
  }];
  

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: item,
    mode: "payment",
    success_url: process.env.SUCCESS_URL,
    cancel_url: process.env.CANCEL_URL,
  });

  return session.url;
};

export { cartCheckoutSession, itemCheckoutSession };