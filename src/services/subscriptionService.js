import Stripe from "stripe";
import dotenv from "dotenv";
import sdb from "./database.js";
import { applyProductDiscount, toStripeAmount } from "../utils/pricing.js";
import { createNotification } from "./notificationService.js";
import { sendEmail } from "./emailService.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_KEY);

const listUserSubscriptions = async (userId) => {
  const { data, error } = await sdb
    .from("Subscription")
    .select("*, Medicine(id, name, price, discount, Images(thumb_img))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const createSubscriptionCheckout = async (userId, medicineId, quantity = 1) => {
  const { data: medicine, error } = await sdb
    .from("Medicine")
    .select("id, name, price, discount, allows_subscription, stock")
    .eq("id", medicineId)
    .single();

  if (error || !medicine) throw new Error("Product not found");
  if (!medicine.allows_subscription) throw new Error("Product does not support subscription");
  if (!medicine.stock) throw new Error("Product out of stock");

  const unitPrice = applyProductDiscount(medicine.price, medicine.discount);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "brl",
        product_data: { name: `${medicine.name} (assinatura mensal)` },
        unit_amount: toStripeAmount(unitPrice),
        recurring: { interval: "month" }
      },
      quantity
    }],
    success_url: `${process.env.SUCCESS_URL}?sessionId={CHECKOUT_SESSION_ID}&subscription=1`,
    cancel_url: process.env.CANCEL_URL,
    metadata: {
      user_id: userId,
      medicine_id: String(medicineId),
      quantity: String(quantity)
    }
  });

  return session.url;
};

const activateSubscription = async ({ userId, medicineId, quantity, stripeSubscriptionId }) => {
  const nextDelivery = new Date();
  nextDelivery.setDate(nextDelivery.getDate() + 30);

  const { data, error } = await sdb
    .from("Subscription")
    .insert({
      user_id: userId,
      medicine_id: medicineId,
      quantity,
      stripe_subscription_id: stripeSubscriptionId,
      status: "active",
      interval_days: 30,
      next_delivery_at: nextDelivery.toISOString()
    })
    .select("*, Medicine(name)")
    .single();

  if (error) throw new Error(error.message);

  await createNotification({
    user_id: userId,
    title: "Assinatura ativada",
    message: `Sua assinatura de ${data.Medicine?.name || "medicamento"} foi ativada.`,
    type: "subscription"
  });

  const { data: user } = await sdb.from("User").select("email").eq("id", userId).single();
  await sendEmail({
    to: user?.email,
    subject: "Assinatura ativada - Umbrella Farmácia",
    text: `Sua assinatura do medicamento ${data.Medicine?.name} foi ativada com sucesso.`
  });

  return data;
};

const cancelSubscriptionByStripeId = async (stripeSubscriptionId) => {
  const { data } = await sdb
    .from("Subscription")
    .select("id, user_id, Medicine(name)")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (!data) return;

  await sdb.from("Subscription").update({ status: "cancelled" }).eq("id", data.id);

  await createNotification({
    user_id: data.user_id,
    title: "Assinatura cancelada",
    message: `Sua assinatura de ${data.Medicine?.name || "medicamento"} foi cancelada.`,
    type: "subscription"
  });
};

const markSubscriptionPaymentFailed = async (stripeSubscriptionId) => {
  const { data } = await sdb
    .from("Subscription")
    .select("id, user_id, Medicine(name)")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (!data) return;

  await sdb.from("Subscription").update({ status: "past_due" }).eq("id", data.id);

  await createNotification({
    user_id: data.user_id,
    title: "Falha no pagamento da assinatura",
    message: `Não foi possível cobrar sua assinatura de ${data.Medicine?.name || "medicamento"}. Atualize seu cartão.`,
    type: "alert"
  });
};

const cancelSubscription = async (userId, subscriptionId) => {
  const { data, error } = await sdb
    .from("Subscription")
    .select("*")
    .eq("id", subscriptionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) throw new Error("Subscription not found");

  if (data.stripe_subscription_id) {
    await stripe.subscriptions.cancel(data.stripe_subscription_id);
  }

  await sdb.from("Subscription").update({ status: "cancelled" }).eq("id", subscriptionId);
};

export {
  listUserSubscriptions,
  createSubscriptionCheckout,
  activateSubscription,
  cancelSubscription,
  cancelSubscriptionByStripeId,
  markSubscriptionPaymentFailed
};
