import Stripe from "stripe";
import dotenv from "dotenv";
import sdb from "./database.js";
import { getPlanByTier } from "./onboardingService.js";
import { getPharmacyPlanUsage } from "./planLimitService.js";
import { createNotification } from "./notificationService.js";
import { sendEmail } from "./emailService.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_KEY);

const getPharmacyBilling = async (pharmacyId) => {
  const { data: pharmacy, error } = await sdb
    .from("Pharmacy")
    .select("id, name, plan_tier, billing_status, stripe_customer_id, stripe_subscription_id, plan_started_at, commission_rate")
    .eq("id", pharmacyId)
    .single();

  if (error || !pharmacy) throw new Error("Pharmacy not found");

  const plan = await getPlanByTier(pharmacy.plan_tier);
  const planUsage = await getPharmacyPlanUsage(pharmacyId);

  return {
    pharmacy,
    plan,
    planUsage,
    requiresPayment: Number(plan.monthly_price) > 0
  };
};

const ensureStripeCustomer = async (pharmacy, ownerEmail) => {
  if (pharmacy.stripe_customer_id) return pharmacy.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: ownerEmail,
    name: pharmacy.name,
    metadata: { pharmacy_id: pharmacy.id }
  });

  await sdb.from("Pharmacy").update({ stripe_customer_id: customer.id }).eq("id", pharmacy.id);
  return customer.id;
};

const createPlanCheckout = async (pharmacyId, planTier, ownerEmail) => {
  const plan = await getPlanByTier(planTier);
  const { data: pharmacy } = await sdb.from("Pharmacy").select("*").eq("id", pharmacyId).single();

  if (!pharmacy) throw new Error("Pharmacy not found");
  if (Number(plan.monthly_price) <= 0) {
    await activatePharmacyPlan(pharmacyId, plan.tier);
    return { mode: "free", activated: true };
  }

  const customerId = await ensureStripeCustomer(pharmacy, ownerEmail);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "brl",
        product_data: { name: `Umbrella SaaS - ${plan.name}` },
        unit_amount: Math.round(Number(plan.monthly_price) * 100),
        recurring: { interval: "month" }
      },
      quantity: 1
    }],
    success_url: `${process.env.SUCCESS_URL}?pharmacyBilling=1&sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.CANCEL_URL,
    metadata: {
      type: "pharmacy_plan",
      pharmacy_id: pharmacyId,
      plan_tier: plan.tier
    },
    subscription_data: {
      metadata: {
        type: "pharmacy_plan",
        pharmacy_id: pharmacyId,
        plan_tier: plan.tier
      }
    }
  });

  await sdb.from("Pharmacy").update({ billing_status: "pending_payment" }).eq("id", pharmacyId);

  return { mode: "checkout", url: session.url };
};

const activatePharmacyPlan = async (pharmacyId, planTier, stripeSubscriptionId = null, stripeCustomerId = null) => {
  const plan = await getPlanByTier(planTier);

  const updatePayload = {
    plan_tier: plan.tier,
    commission_rate: plan.commission_rate,
    billing_status: "active",
    plan_started_at: new Date().toISOString(),
    active: true,
    operational_status: "open"
  };

  if (stripeSubscriptionId) updatePayload.stripe_subscription_id = stripeSubscriptionId;
  if (stripeCustomerId) updatePayload.stripe_customer_id = stripeCustomerId;

  const { data, error } = await sdb
    .from("Pharmacy")
    .update(updatePayload)
    .eq("id", pharmacyId)
    .select("*, owner_user_id")
    .single();

  if (error) throw new Error(error.message);

  if (data.owner_user_id) {
    await createNotification({
      user_id: data.owner_user_id,
      title: "Plano ativado",
      message: `O plano ${plan.name} da farmácia ${data.name} está ativo.`,
      type: "info"
    });
  }

  return data;
};

const activatePharmacyBillingFromCheckout = async (session) => {
  const pharmacyId = session.metadata?.pharmacy_id;
  const planTier = session.metadata?.plan_tier;

  if (!pharmacyId || !planTier) return false;

  await activatePharmacyPlan(pharmacyId, planTier, session.subscription, session.customer);
  return true;
};

const cancelPharmacyBillingByStripeId = async (stripeSubscriptionId) => {
  const { data } = await sdb
    .from("Pharmacy")
    .select("id, name, owner_user_id, plan_tier")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (!data) return false;

  await sdb
    .from("Pharmacy")
    .update({ billing_status: "cancelled", stripe_subscription_id: null })
    .eq("id", data.id);

  if (data.owner_user_id) {
    await createNotification({
      user_id: data.owner_user_id,
      title: "Assinatura do plano cancelada",
      message: `A assinatura SaaS da farmácia ${data.name} foi cancelada. O plano voltará ao gratuito.`,
      type: "alert"
    });
  }

  await activatePharmacyPlan(data.id, "free");
  return true;
};

const markPharmacyBillingPastDue = async (stripeSubscriptionId) => {
  const { data } = await sdb
    .from("Pharmacy")
    .select("id, name, owner_user_id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (!data) return false;

  await sdb.from("Pharmacy").update({ billing_status: "past_due" }).eq("id", data.id);

  if (data.owner_user_id) {
    const { data: owner } = await sdb.from("User").select("email").eq("id", data.owner_user_id).single();
    await createNotification({
      user_id: data.owner_user_id,
      title: "Falha no pagamento do plano",
      message: `Não foi possível cobrar o plano SaaS da farmácia ${data.name}.`,
      type: "alert"
    });
    await sendEmail({
      to: owner?.email,
      subject: "Falha no pagamento - Umbrella SaaS",
      text: `Atualize o cartão da assinatura do plano da farmácia ${data.name}.`
    });
  }

  return true;
};

const createBillingPortal = async (pharmacyId) => {
  const { data: pharmacy } = await sdb
    .from("Pharmacy")
    .select("stripe_customer_id")
    .eq("id", pharmacyId)
    .single();

  if (!pharmacy?.stripe_customer_id) throw new Error("Billing not configured");

  const session = await stripe.billingPortal.sessions.create({
    customer: pharmacy.stripe_customer_id,
    return_url: process.env.PHARMACY_PANEL_URL || process.env.SUCCESS_URL?.replace("/checkout/success", "/pharmacy") || "http://localhost:4200/pharmacy"
  });

  return session.url;
};

export {
  getPharmacyBilling,
  createPlanCheckout,
  activatePharmacyPlan,
  activatePharmacyBillingFromCheckout,
  cancelPharmacyBillingByStripeId,
  markPharmacyBillingPastDue,
  createBillingPortal
};
