import Stripe from "stripe";
import dotenv from "dotenv";
import sdb from "./database.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_KEY);

const refreshConnectStatus = async (pharmacyId) => {
  const { data: pharmacy, error } = await sdb
    .from("Pharmacy")
    .select("id, stripe_connect_account_id, connect_onboarding_status")
    .eq("id", pharmacyId)
    .single();

  if (error || !pharmacy?.stripe_connect_account_id) {
    return { connected: false, onboarding_status: pharmacy?.connect_onboarding_status || "not_started" };
  }

  const account = await stripe.accounts.retrieve(pharmacy.stripe_connect_account_id);
  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const onboardingStatus = chargesEnabled ? "complete" : "pending";

  await sdb
    .from("Pharmacy")
    .update({
      connect_charges_enabled: chargesEnabled,
      connect_payouts_enabled: payoutsEnabled,
      connect_onboarding_status: onboardingStatus
    })
    .eq("id", pharmacyId);

  return {
    connected: chargesEnabled,
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
    onboarding_status: onboardingStatus,
    stripe_connect_account_id: pharmacy.stripe_connect_account_id
  };
};

const ensureConnectAccount = async (pharmacyId) => {
  const { data: pharmacy, error } = await sdb
    .from("Pharmacy")
    .select("id, name, stripe_connect_account_id")
    .eq("id", pharmacyId)
    .single();

  if (error || !pharmacy) throw new Error("Pharmacy not found");

  if (pharmacy.stripe_connect_account_id) {
    return pharmacy.stripe_connect_account_id;
  }

  const account = await stripe.accounts.create({
    type: "express",
    country: "BR",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    },
    business_type: "company",
    metadata: { pharmacy_id: pharmacyId }
  });

  await sdb
    .from("Pharmacy")
    .update({
      stripe_connect_account_id: account.id,
      connect_onboarding_status: "pending"
    })
    .eq("id", pharmacyId);

  return account.id;
};

const createConnectOnboardingLink = async (pharmacyId) => {
  const accountId = await ensureConnectAccount(pharmacyId);

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: process.env.CONNECT_REFRESH_URL || process.env.CANCEL_URL,
    return_url: process.env.CONNECT_RETURN_URL || process.env.SUCCESS_URL,
    type: "account_onboarding"
  });

  return { url: accountLink.url, account_id: accountId };
};

const handleAccountUpdated = async (account) => {
  const pharmacyId = account.metadata?.pharmacy_id;
  if (!pharmacyId) return;

  await sdb
    .from("Pharmacy")
    .update({
      connect_charges_enabled: Boolean(account.charges_enabled),
      connect_payouts_enabled: Boolean(account.payouts_enabled),
      connect_onboarding_status: account.charges_enabled ? "complete" : "pending"
    })
    .eq("id", pharmacyId);
};

const getPharmacyPaymentConfig = async (pharmacyId) => {
  if (!pharmacyId || pharmacyId === "default") return null;

  const { data, error } = await sdb
    .from("Pharmacy")
    .select("stripe_connect_account_id, connect_charges_enabled, commission_rate")
    .eq("id", pharmacyId)
    .single();

  if (error || !data?.stripe_connect_account_id || !data.connect_charges_enabled) {
    return null;
  }

  return data;
};

export {
  refreshConnectStatus,
  createConnectOnboardingLink,
  handleAccountUpdated,
  getPharmacyPaymentConfig
};
