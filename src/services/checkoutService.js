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
import {
  activatePharmacyBillingFromCheckout,
  cancelPharmacyBillingByStripeId,
  markPharmacyBillingPastDue
} from "./billingService.js";
import { getPharmacyPaymentConfig, handleAccountUpdated, executeUnifiedTransfers } from "./connectService.js";
import { fulfillSubscriptionRenewal } from "./subscriptionService.js";
import { scanPriceAlerts } from "./priceAlertService.js";
import {
  createOrderGroup,
  saveOrderGroupCheckout,
  getOrderGroupSplitPlan,
  updateOrderGroupStatus
} from "./orderGroupService.js";
import { fulfillOrderLogistics as runOrderLogistics } from "./orderLogisticsService.js";

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

const buildLineItems = (cartItems, priceRatio = 1, namePrefix = "") =>
  cartItems.map((item) => {
    const unitPrice = applyProductDiscount(item.Medicine.price, item.Medicine.discount) * priceRatio;
    const label = namePrefix ? `${namePrefix} — ${item.Medicine.name}` : item.Medicine.name;
    return {
      price_data: {
        currency: "brl",
        product_data: { name: label },
        unit_amount: toStripeAmount(unitPrice)
      },
      quantity: item.quantity
    };
  });

const computeCouponRatio = async (couponCode, cartItems) => {
  if (!couponCode) return { ratio: 1, coupon: null };

  const subtotal = cartItems.reduce((sum, item) => {
    const unit = applyProductDiscount(item.Medicine.price, item.Medicine.discount);
    return sum + unit * item.quantity;
  }, 0);

  const coupon = await validateCoupon(couponCode, subtotal);
  const discountedTotal = applyCouponDiscount(subtotal, coupon);
  const ratio = subtotal > 0 ? discountedTotal / subtotal : 1;
  return { ratio, coupon };
};

const buildSplitPlan = async (groups, couponRatio, fulfillmentByPharmacy) => {
  const splitPlan = [];

  for (const [pharmacyId, items] of Object.entries(groups)) {
    const pharmacyName = items[0]?.Medicine?.Pharmacy?.name || "Farmácia";
    const productSubtotal = items.reduce((sum, item) => {
      const unit = applyProductDiscount(item.Medicine.price, item.Medicine.discount) * couponRatio;
      return sum + unit * item.quantity;
    }, 0);

    const fulfillment = fulfillmentByPharmacy(pharmacyId);
    const deliveryFee = fulfillment.fulfillment_mode === "delivery"
      ? Number(fulfillment.delivery_fee || 0)
      : 0;
    const grossTotal = productSubtotal + deliveryFee;
    const grossCents = toStripeAmount(grossTotal);

    const paymentConfig = await getPharmacyPaymentConfig(pharmacyId);
    const feeRate = Number(paymentConfig?.commission_rate ?? 0.1);
    const applicationFeeCents = Math.round(grossCents * feeRate);
    const transferCents = paymentConfig ? grossCents - applicationFeeCents : 0;

    splitPlan.push({
      pharmacy_id: pharmacyId,
      pharmacy_name: pharmacyName,
      product_subtotal: Number(productSubtotal.toFixed(2)),
      delivery_fee: deliveryFee,
      gross_cents: grossCents,
      application_fee_cents: applicationFeeCents,
      transfer_cents: transferCents,
      connect_account_id: paymentConfig?.stripe_connect_account_id || null,
      fulfillment: {
        fulfillment_mode: fulfillment.fulfillment_mode || "delivery",
        delivery_fee: deliveryFee,
        eta_minutes: fulfillment.eta_minutes,
        courier: fulfillment.courier || "local",
        destination_address: fulfillment.destination_address || "",
        destination_lat: fulfillment.destination_lat,
        destination_lng: fulfillment.destination_lng
      }
    });
  }

  return splitPlan;
};

const buildUnifiedLineItems = (groups, couponRatio, fulfillmentByPharmacy) => {
  const lineItems = [];

  for (const [pharmacyId, items] of Object.entries(groups)) {
    const pharmacyName = items[0]?.Medicine?.Pharmacy?.name || "Farmácia";
    lineItems.push(...buildLineItems(items, couponRatio, pharmacyName));

    const fulfillment = fulfillmentByPharmacy(pharmacyId);
    const deliveryFee = fulfillment.fulfillment_mode === "delivery"
      ? Number(fulfillment.delivery_fee || 0)
      : 0;

    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: { name: `Entrega — ${pharmacyName}` },
          unit_amount: toStripeAmount(deliveryFee)
        },
        quantity: 1
      });
    }
  }

  return lineItems;
};

const insertPurchaseRows = async ({
  sessionId,
  userId,
  cartItems,
  couponRatio,
  fulfillmentByPharmacy,
  orderGroupId
}) => {
  const deliveryAssigned = new Set();

  const purchaseData = cartItems.map((item) => {
    const pharmacyId = item.Medicine.pharmacy_id || null;
    const fulfillment = fulfillmentByPharmacy(pharmacyId || "default");
    const includeDelivery = pharmacyId && !deliveryAssigned.has(pharmacyId);
    if (includeDelivery) deliveryAssigned.add(pharmacyId);

    return {
      id: sessionId,
      user_id: userId,
      medicine_id: item.medicine_id,
      quantity: item.quantity,
      total_price: applyProductDiscount(item.Medicine.price, item.Medicine.discount) * couponRatio * item.quantity,
      payment_status: "pending",
      payment_method: "Cartão de credito",
      order_status: "pending_payment",
      pharmacy_id: pharmacyId,
      fulfillment_mode: fulfillment.fulfillment_mode || "delivery",
      delivery_fee: includeDelivery && fulfillment.fulfillment_mode === "delivery"
        ? Number(fulfillment.delivery_fee || 0)
        : 0,
      order_group_id: orderGroupId || null
    };
  });

  const { error: purchaseError } = await sdb.from("Purchase").insert(purchaseData);
  if (purchaseError) throw new Error(purchaseError.message);
};

const createUnifiedMultiSession = async (userId, cartItems, groups, couponCode, fulfillmentByPharmacy) => {
  const { ratio: couponRatio, coupon } = await computeCouponRatio(couponCode, cartItems);
  const splitPlan = await buildSplitPlan(groups, couponRatio, fulfillmentByPharmacy);
  const lineItems = buildUnifiedLineItems(groups, couponRatio, fulfillmentByPharmacy);
  const orderGroup = await createOrderGroup(userId, { checkoutMode: "unified" });

  const firstFulfillment = fulfillmentByPharmacy(Object.keys(groups)[0]);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.SUCCESS_URL}?sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.CANCEL_URL,
    metadata: {
      checkout_mode: "unified_multi",
      order_group_id: orderGroup.id,
      fulfillment_mode: firstFulfillment.fulfillment_mode || "delivery",
      destination_address: firstFulfillment.destination_address || "",
      destination_lat: firstFulfillment.destination_lat ? String(firstFulfillment.destination_lat) : "",
      destination_lng: firstFulfillment.destination_lng ? String(firstFulfillment.destination_lng) : "",
      courier: firstFulfillment.courier || "local"
    }
  });

  await saveOrderGroupCheckout(orderGroup.id, {
    splitPlan,
    stripeSessionId: session.id,
    checkoutMode: "unified"
  });

  await insertPurchaseRows({
    sessionId: session.id,
    userId,
    cartItems,
    couponRatio,
    fulfillmentByPharmacy,
    orderGroupId: orderGroup.id
  });

  if (coupon) await incrementCouponUsage(coupon.code);

  return {
    mode: "unified",
    url: session.url,
    order_group_id: orderGroup.id,
    pharmacy_count: Object.keys(groups).length
  };
};

const groupByPharmacy = (cartItems) => {
  const groups = {};
  for (const item of cartItems) {
    const key = item.Medicine.pharmacy_id || "default";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
};

const createSessionForItems = async (userId, cartItems, couponCode = null, fulfillment = {}, orderGroupId = null) => {
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

  const deliveryFee = fulfillment.fulfillment_mode === "delivery"
    ? Number(fulfillment.delivery_fee || 0)
    : 0;

  if (deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: "brl",
        product_data: { name: "Entrega" },
        unit_amount: toStripeAmount(deliveryFee)
      },
      quantity: 1
    });
  }

  const pharmacyId = cartItems[0]?.Medicine?.pharmacy_id;
  const paymentConfig = await getPharmacyPaymentConfig(pharmacyId);

  const sessionPayload = {
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.SUCCESS_URL}?sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.CANCEL_URL,
    metadata: {
      fulfillment_mode: fulfillment.fulfillment_mode || "delivery",
      delivery_fee: String(deliveryFee),
      destination_address: fulfillment.destination_address || "",
      destination_lat: fulfillment.destination_lat ? String(fulfillment.destination_lat) : "",
      destination_lng: fulfillment.destination_lng ? String(fulfillment.destination_lng) : "",
      courier: fulfillment.courier || "local",
      eta_minutes: fulfillment.eta_minutes ? String(fulfillment.eta_minutes) : ""
    }
  };

  if (paymentConfig) {
    const subtotalCents = lineItems.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0
    );
    const feeRate = Number(paymentConfig.commission_rate ?? 0.1);
    const applicationFee = Math.round(subtotalCents * feeRate);

    sessionPayload.payment_intent_data = {
      application_fee_amount: applicationFee,
      transfer_data: { destination: paymentConfig.stripe_connect_account_id }
    };
  }

  const session = await stripe.checkout.sessions.create(sessionPayload);

  const purchaseData = cartItems.map((item) => ({
    id: session.id,
    user_id: userId,
    medicine_id: item.medicine_id,
    quantity: item.quantity,
    total_price: applyProductDiscount(item.Medicine.price, item.Medicine.discount) * item.quantity,
    payment_status: "pending",
    payment_method: "Cartão de credito",
    order_status: "pending_payment",
    pharmacy_id: item.Medicine.pharmacy_id || null,
    fulfillment_mode: fulfillment.fulfillment_mode || "delivery",
    delivery_fee: deliveryFee,
    order_group_id: orderGroupId || null
  }));

  const { error: purchaseError } = await sdb.from("Purchase").insert(purchaseData);
  if (purchaseError) throw new Error(purchaseError.message);

  if (coupon) await incrementCouponUsage(coupon.code);

  return session.url;
};

const cartCheckoutSession = async (userId, options = {}) => {
  const {
    couponCode,
    fulfillment_mode = "delivery",
    destination_lat,
    destination_lng,
    destination_address,
    courier = "local",
    delivery_quotes = {}
  } = options;

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

  const buildFulfillment = (pharmacyKey) => {
    const quote = delivery_quotes[pharmacyKey] || {};
    return {
      fulfillment_mode,
      delivery_fee: quote.price || 0,
      eta_minutes: quote.eta_minutes,
      courier: quote.courier || courier,
      destination_lat,
      destination_lng,
      destination_address
    };
  };

  if (pharmacyKeys.length === 1) {
    const url = await createSessionForItems(
      userId,
      cartItems,
      couponCode,
      buildFulfillment(pharmacyKeys[0])
    );
    return { mode: "single", url, fulfillment_mode };
  }

  return createUnifiedMultiSession(
    userId,
    cartItems,
    groups,
    couponCode,
    buildFulfillment
  );
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
    await handleSuccessfulPayment(sessionId, session.metadata || {});
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

const fulfillOrderLogistics = async (sessionId, purchaseItems, sessionMetadata = {}) => {
  const first = purchaseItems[0];
  if (!first) return;

  await runOrderLogistics({
    purchaseId: sessionId,
    userId: first.user_id,
    pharmacyId: first.pharmacy_id,
    fulfillmentMode: first.fulfillment_mode || sessionMetadata.fulfillment_mode || "delivery",
    deliveryFee: first.delivery_fee || sessionMetadata.delivery_fee,
    etaMinutes: sessionMetadata.eta_minutes,
    courier: sessionMetadata.courier,
    destinationAddress: sessionMetadata.destination_address,
    destLat: sessionMetadata.destination_lat,
    destLng: sessionMetadata.destination_lng
  });
};

const fulfillUnifiedLogistics = async (sessionId, purchaseItems, splitPlan) => {
  const userId = purchaseItems[0]?.user_id;
  if (!userId || !splitPlan?.length) return;

  for (const split of splitPlan) {
    await runOrderLogistics({
      purchaseId: sessionId,
      userId,
      pharmacyId: split.pharmacy_id,
      fulfillmentMode: split.fulfillment?.fulfillment_mode || "delivery",
      deliveryFee: split.fulfillment?.delivery_fee,
      etaMinutes: split.fulfillment?.eta_minutes,
      courier: split.fulfillment?.courier,
      destinationAddress: split.fulfillment?.destination_address,
      destLat: split.fulfillment?.destination_lat,
      destLng: split.fulfillment?.destination_lng
    });
  }
};

const handleSuccessfulPayment = async (sessionId, sessionMetadata = {}) => {
  const purchaseItems = await getPurchaseData(sessionId);

  const orderGroupId = purchaseItems[0]?.order_group_id;
  let splitPlan = [];

  if (orderGroupId) {
    const groupData = await getOrderGroupSplitPlan(orderGroupId).catch(() => null);
    splitPlan = groupData?.split_plan || [];
    await updateOrderGroupStatus(orderGroupId);
  }

  if (sessionMetadata.checkout_mode === "unified_multi" && splitPlan.length) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

    await executeUnifiedTransfers({ sessionId, paymentIntentId, splitPlan });
  }

  const pharmacyIds = [...new Set(purchaseItems.map((item) => item.pharmacy_id).filter(Boolean))];
  for (const pharmacyId of pharmacyIds) {
    await recordPurchaseFees(sessionId, pharmacyId);
  }

  if (splitPlan.length) {
    await fulfillUnifiedLogistics(sessionId, purchaseItems, splitPlan);
  } else {
    await fulfillOrderLogistics(sessionId, purchaseItems, sessionMetadata);
  }

  await scanPriceAlerts().catch((err) => console.error("Price alert scan failed:", err.message));

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
    .select("user_id, medicine_id, quantity, pharmacy_id, fulfillment_mode, delivery_fee, order_group_id")
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
      if (session.metadata?.type === "pharmacy_plan") {
        await activatePharmacyBillingFromCheckout(session);
      } else {
        await activateSubscription({
          userId: session.metadata.user_id,
          medicineId: Number(session.metadata.medicine_id),
          quantity: Number(session.metadata.quantity || 1),
          stripeSubscriptionId: session.subscription
        });
      }
    } else {
      await updatePaymentStatus(session.id);
    }
  }

  if (event.type === "checkout.session.async_payment_failed") {
    await updatePurchaseStatus(event.data.object.id, "unpaid");
  }

  if (event.type === "customer.subscription.deleted") {
    const subscriptionId = event.data.object.id;
    const handled = await cancelPharmacyBillingByStripeId(subscriptionId);
    if (!handled) await cancelSubscriptionByStripeId(subscriptionId);
  }

  if (event.type === "invoice.payment_failed") {
    const subscriptionId = event.data.object.subscription;
    if (subscriptionId) {
      const handled = await markPharmacyBillingPastDue(subscriptionId);
      if (!handled) await markSubscriptionPaymentFailed(subscriptionId);
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    await fulfillSubscriptionRenewal(event.data.object);
  }

  if (event.type === "account.updated") {
    await handleAccountUpdated(event.data.object);
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
