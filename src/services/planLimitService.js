import sdb from "./database.js";
import { getPlanByTier } from "./onboardingService.js";

const getPharmacyPlanUsage = async (pharmacyId) => {
  if (!pharmacyId) {
    return { productCount: 0, maxProducts: null, canAddMore: true, planTier: null };
  }

  const { data: pharmacy, error } = await sdb
    .from("Pharmacy")
    .select("plan_tier")
    .eq("id", pharmacyId)
    .single();

  if (error || !pharmacy) throw new Error("Pharmacy not found");

  const plan = await getPlanByTier(pharmacy.plan_tier);
  const { count } = await sdb
    .from("Medicine")
    .select("id", { count: "exact", head: true })
    .eq("pharmacy_id", pharmacyId);

  const productCount = count || 0;
  const maxProducts = plan.max_products;

  return {
    productCount,
    maxProducts,
    canAddMore: maxProducts === null || productCount < maxProducts,
    planTier: plan.tier,
    planName: plan.name
  };
};

const assertCanAddProduct = async (pharmacyId) => {
  if (!pharmacyId) return;

  const usage = await getPharmacyPlanUsage(pharmacyId);
  if (!usage.canAddMore) {
    const error = new Error(
      `Product limit reached for plan ${usage.planName} (${usage.maxProducts} products)`
    );
    error.status = 403;
    throw error;
  }
};

export { getPharmacyPlanUsage, assertCanAddProduct };
