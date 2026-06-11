import sdb from "./database.js";
import { createNotification } from "./notificationService.js";
import { sendEmail } from "./emailService.js";

const listPlans = async () => {
  const { data, error } = await sdb
    .from("SaasPlan")
    .select("*")
    .eq("active", true)
    .order("monthly_price", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

const getPlanByTier = async (tier) => {
  const { data, error } = await sdb
    .from("SaasPlan")
    .select("*")
    .eq("tier", tier)
    .eq("active", true)
    .single();

  if (error || !data) throw new Error("Plan not found");
  return data;
};

const getUserOnboardingStatus = async (userId) => {
  const { data: user, error } = await sdb
    .from("User")
    .select("pharmacy_id, role")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  if (!user?.pharmacy_id) return { status: "none" };

  const { data: pharmacy } = await sdb
    .from("Pharmacy")
    .select("id, name, onboarding_status, plan_tier, rejected_reason, created_at")
    .eq("id", user.pharmacy_id)
    .single();

  return {
    status: pharmacy?.onboarding_status || "none",
    pharmacy,
    role: user.role
  };
};

const registerPharmacy = async (userId, payload) => {
  const existing = await getUserOnboardingStatus(userId);
  if (existing.pharmacy) {
    throw new Error("User already has a pharmacy registration");
  }

  const plan = await getPlanByTier(payload.plan_tier || "free");

  const { data: pharmacy, error: pharmacyError } = await sdb
    .from("Pharmacy")
    .insert({
      name: payload.name,
      cnpj: payload.cnpj,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      cep: payload.cep,
      phone: payload.phone,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      plan_tier: plan.tier,
      commission_rate: plan.commission_rate,
      tenant_domain: payload.tenant_domain || null,
      onboarding_status: "pending",
      operational_status: "closed",
      active: false,
      owner_user_id: userId
    })
    .select()
    .single();

  if (pharmacyError) throw new Error(pharmacyError.message);

  const { error: userError } = await sdb
    .from("User")
    .update({ role: "pharmacist", pharmacy_id: pharmacy.id })
    .eq("id", userId);

  if (userError) throw new Error(userError.message);

  const { data: admins } = await sdb.from("User").select("id, email").eq("role", "admin");
  for (const admin of admins || []) {
    await createNotification({
      user_id: admin.id,
      title: "Nova farmácia pendente",
      message: `${pharmacy.name} solicitou cadastro no plano ${plan.name}.`,
      type: "alert"
    });
    await sendEmail({
      to: admin.email,
      subject: "Nova farmácia pendente - Umbrella",
      text: `A farmácia ${pharmacy.name} aguarda aprovação.`
    });
  }

  return pharmacy;
};

const listPendingPharmacies = async () => {
  const { data, error } = await sdb
    .from("Pharmacy")
    .select("*")
    .eq("onboarding_status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const ownerIds = [...new Set((data || []).map((p) => p.owner_user_id).filter(Boolean))];
  if (!ownerIds.length) return data || [];

  const { data: owners } = await sdb.from("User").select("id, email, name").in("id", ownerIds);
  const ownerMap = Object.fromEntries((owners || []).map((u) => [u.id, u]));

  return (data || []).map((pharmacy) => ({
    ...pharmacy,
    owner: ownerMap[pharmacy.owner_user_id] || null
  }));
};

const approvePharmacy = async (pharmacyId) => {
  const { data: current } = await sdb.from("Pharmacy").select("plan_tier").eq("id", pharmacyId).single();
  const plan = await getPlanByTier(current?.plan_tier || "free");
  const billingStatus = Number(plan.monthly_price) > 0 ? "pending_payment" : "active";

  const { data, error } = await sdb
    .from("Pharmacy")
    .update({
      onboarding_status: "approved",
      active: billingStatus === "active",
      operational_status: billingStatus === "active" ? "open" : "closed",
      approved_at: new Date().toISOString(),
      rejected_reason: null,
      billing_status: billingStatus,
      plan_started_at: billingStatus === "active" ? new Date().toISOString() : null
    })
    .eq("id", pharmacyId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (data.owner_user_id) {
    const { data: owner } = await sdb.from("User").select("email").eq("id", data.owner_user_id).single();
    const billingNote = billingStatus === "pending_payment"
      ? " Ative o plano pago no painel da farmácia para começar a vender."
      : "";

    await createNotification({
      user_id: data.owner_user_id,
      title: "Farmácia aprovada",
      message: `Sua farmácia ${data.name} foi aprovada.${billingNote}`,
      type: "info"
    });
    await sendEmail({
      to: owner?.email,
      subject: "Farmácia aprovada - Umbrella",
      text: `Parabéns! Sua farmácia ${data.name} foi aprovada.${billingNote}`
    });
  }

  return data;
};

const rejectPharmacy = async (pharmacyId, reason) => {
  const { data, error } = await sdb
    .from("Pharmacy")
    .update({
      onboarding_status: "rejected",
      active: false,
      operational_status: "closed",
      rejected_reason: reason || "Cadastro recusado"
    })
    .eq("id", pharmacyId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (data.owner_user_id) {
    await createNotification({
      user_id: data.owner_user_id,
      title: "Farmácia recusada",
      message: data.rejected_reason,
      type: "alert"
    });
  }

  return data;
};

export {
  listPlans,
  getPlanByTier,
  getUserOnboardingStatus,
  registerPharmacy,
  listPendingPharmacies,
  approvePharmacy,
  rejectPharmacy
};
