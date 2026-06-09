import sdb from "./database.js";
import Stripe from "stripe";
import dotenv from "dotenv";
import { addProductToCart, deleteProductFromCart } from "./cartService.js";
import { applyProductDiscount, applyCouponDiscount, toStripeAmount } from "../utils/pricing.js";
import { validateCoupon, incrementCouponUsage } from "./couponService.js";
import { hasApprovedPrescription } from "./prescriptionService.js";
import { createNotification } from "./notificationService.js";
import { sendEmail } from "./emailService.js";
import {
  activateSubscription,
  cancelSubscriptionByStripeId,
  markSubscriptionPaymentFailed
} from "./subscriptionService.js";
import { recordPurchaseFees } from "./financialService.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_KEY);

const ensurePrescriptions = async (userId, cartItems) => {
  for (const item of cartItems) {
    const medicine = item.Medicine;
    if (medicine?.requires_prescription) {
      const approved = await hasApprovedPrescription(userId, item.medicine_id);
      if (!approved) throw new Error(`Prescription required for ${medicine.name}`);
    }
  }
};

const buildLineItems = (cartItems, priceRatio = 1) =>
  cartItems.map((item) => {
    const unitPrice = applyProductDiscount(item.Medicine.price, item.Medicine.discount) * priceRatio;
    return {
      price_data: {
        currency: "brl",
        product_data: { name: item.Medicine.name },
        unit_amount: toStripeAmount(unitPrice)
      },
      quantity: item.quantity
    };
  });

const groupByPharmacy = (cartItems) => {
  const groups = {};
  for (const item of cartItems) {
    const key = item.Medicine.pharmacy_id || "default";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
};

const createSessionForItems = async (userId, cartItems, couponCode = null) => {
  let lineItems = buildLineItems(cartItems);
  let coupon = null;

  const subtotal = cartItems.reduce((sum, item) => {
    const unit = applyProductDiscount(item.Medicine.price, item.Medicine.discount);
    return sum + unit * item.quantity;
  }, 0);

  if (couponCode) {
    coupon = await validateCoupon(couponCode, subtotal);
    const discountedTotal = applyCouponDiscount(subtotal, coupon);
    const ratio = subtotal > 0 ? discountedTotal / subtotal : 1;
    lineItems = buildLineItems(cartItems, ratio);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.SUCCESS_URL}?sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.CANCEL_URL
  });

  const purchaseData = cartItems.map((item) => ({
    id: session.id,
    user_id: userId,
    medicine_id: item.medicine_id,
    quantity: item.quantity,
    total_price: applyProductDiscount(item.Medicine.price, item.Medicine.discount) * item.quantity,
    payment_status: "pending",
    payment_method: "Cartão de credito",
    order_status: "pending_payment",
    pharmacy_id: item.Medicine.pharmacy_id || null
  }));

  const { error: purchaseError } = await sdb.from("Purchase").insert(purchaseData);
  if (purchaseError) throw new Error(purchaseError.message);

  if (coupon) await incrementCouponUsage(coupon.code);

  return session.url;
};

const cartCheckoutSession = async (userId, couponCode) => {
  const { data: cartItems, error: cartError } = await sdb
    .from("Cart")
    .select(`
      quantity,
      medicine_id,
      Medicine(name, price, discount, requires_prescription, pharmacy_id, Pharmacy(name))
    `)
    .eq("user_id", userId);

  if (!cartItems?.length) throw new Error("Cart is empty");
  if (cartError) throw new Error(cartError.message);

  await ensurePrescriptions(userId, cartItems);

  const groups = groupByPharmacy(cartItems);
  const pharmacyKeys = Object.keys(groups);

  if (pharmacyKeys.length === 1) {
    const url = await createSessionForItems(userId, cartItems, couponCode);
    return { mode: "single", url };
  }

  const sessions = [];
  for (let i = 0; i < pharmacyKeys.length; i++) {
    const key = pharmacyKeys[i];
    const items = groups[key];
    const pharmacyName = items[0]?.Medicine?.Pharmacy?.name || "Farmácia";
    const url = await createSessionForItems(userId, items, i === 0 ? couponCode : null);
    sessions.push({ pharmacyId: key, pharmacyName, url, items: items.length });
  }

  return { mode: "multi", sessions };
};

const itemCheckoutSession = async (userId, productId, quantity, couponCode) => {
  await addProductToCart(userId, productId, quantity);

  const { data, error } = await sdb
    .from("Cart")
    .select(`quantity, medicine_id, Medicine(name, price, discount, requires_prescription, pharmacy_id)`)
    .eq("user_id", userId)
    .eq("medicine_id", productId)
    .single();

  if (!data) throw new Error("Cart is empty");
  if (error) throw new Error(error.message);

  await ensurePrescriptions(userId, [data]);

  const url = await createSessionForItems(userId, [data], couponCode);
  return { mode: "single", url };
};

const wasAlreadyPaid = async (sessionId) => {
  const { data } = await sdb.from("Purchase").select("payment_status").eq("id", sessionId).limit(1);
  return data?.[0]?.payment_status === "paid";
};

const updatePaymentStatus = async (sessionId) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const status = session.payment_status;
  const alreadyPaid = await wasAlreadyPaid(sessionId);

  await updatePurchaseStatus(sessionId, status);

  if (status === "paid" && !alreadyPaid) {
    await handleSuccessfulPayment(sessionId);
  }

  return status;
};

const updatePurchaseStatus = async (sessionId, status) => {
  const orderStatus = status === "paid" ? "processing" : "pending_payment";
  const { error } = await sdb
    .from("Purchase")
    .update({ payment_status: status, order_status: orderStatus })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
};

const handleSuccessfulPayment = async (sessionId) => {
  const purchaseItems = await getPurchaseData(sessionId);

  const pharmacyIds = [...new Set(purchaseItems.map((item) => item.pharmacy_id).filter(Boolean))];
  for (const pharmacyId of pharmacyIds) {
    await recordPurchaseFees(sessionId, pharmacyId);
  }

  for (const item of purchaseItems) {
    const stock = await getMedicineStock(item.medicine_id);
    await updateMedicineStock(item.medicine_id, stock - item.quantity);
    await deleteProductFromCart(item.user_id, item.medicine_id);

    await createNotification({
      user_id: item.user_id,
      title: "Pagamento confirmado",
      message: `Seu pedido ${sessionId.slice(-8)} foi pago e está em processamento.`,
      type: "order"
    });
  }

  const userId = purchaseItems[0]?.user_id;
  if (userId) {
    const { data: user } = await sdb.from("User").select("email, name").eq("id", userId).single();
    await sendEmail({
      to: user?.email,
      subject: "Pagamento confirmado - Umbrella Farmácia",
      text: `Olá ${user?.name || ""}, seu pagamento foi confirmado. Pedido: ${sessionId.slice(-8)}.`
    });
  }
};

const getPurchaseData = async (sessionId) => {
  const { data, error } = await sdb
    .from("Purchase")
    .select("user_id, medicine_id, quantity, pharmacy_id")
    .eq("id", sessionId);

  if (error || !data?.length) {
    throw new Error(`Failed to retrieve purchase data: ${error?.message || "Data not found"}`);
  }

  return data;
};

const getMedicineStock = async (medicineId) => {
  const { data, error } = await sdb.from("Medicine").select("stock").eq("id", medicineId).single();
  if (error || !data) throw new Error(`Failed to retrieve medicine stock: ${error?.message || "Data not found"}`);
  return data.stock;
};

const updateMedicineStock = async (medicineId, newStock) => {
  if (newStock < 0) throw new Error("Stock cannot be negative");
  const { error } = await sdb.from("Medicine").update({ stock: newStock }).eq("id", medicineId);
  if (error) throw new Error(`Failed to update medicine stock: ${error.message}`);
};

const isEventProcessed = async (eventId) => {
  const { data } = await sdb.from("WebhookEvent").select("id").eq("id", eventId).maybeSingle();
  return Boolean(data);
};

const markEventProcessed = async (eventId, type) => {
  await sdb.from("WebhookEvent").insert({ id: eventId, type });
};

const handleStripeWebhook = async (rawBody, signature) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("Webhook secret not configured");

  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  if (await isEventProcessed(event.id)) {
    return { received: true, duplicate: true };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.mode === "subscription" && session.subscription) {
      await activateSubscription({
        userId: session.metadata.user_id,
        medicineId: Number(session.metadata.medicine_id),
        quantity: Number(session.metadata.quantity || 1),
        stripeSubscriptionId: session.subscription
      });
    } else {
      await updatePaymentStatus(session.id);
    }
  }

  if (event.type === "checkout.session.async_payment_failed") {
    await updatePurchaseStatus(event.data.object.id, "unpaid");
  }

  if (event.type === "customer.subscription.deleted") {
    await cancelSubscriptionByStripeId(event.data.object.id);
  }

  if (event.type === "invoice.payment_failed") {
    const subscriptionId = event.data.object.subscription;
    if (subscriptionId) await markSubscriptionPaymentFailed(subscriptionId);
  }

  await markEventProcessed(event.id, event.type);
  return { received: true };
};

export {
  cartCheckoutSession,
  itemCheckoutSession,
  updatePaymentStatus,
  handleStripeWebhook
};
