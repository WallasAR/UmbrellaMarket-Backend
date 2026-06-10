import sdb from "./database.js";

const PRODUCT_SELECT = `
  *,
  Images!left(thumb_img),
  Pharmacy!left(id, name, city)
`;

const getActiveBoosts = async () => {
  const now = new Date().toISOString();

  const { data: boosts, error } = await sdb
    .from("SponsoredBoost")
    .select("medicine_id, priority")
    .eq("active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("priority", { ascending: false });

  if (error) throw new Error(error.message);
  if (!boosts?.length) return [];

  const ids = boosts.map((row) => row.medicine_id);
  const { data: products, error: prodError } = await sdb
    .from("Medicine")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .gt("stock", 0);

  if (prodError) throw new Error(prodError.message);

  const priorityMap = new Map(boosts.map((row) => [row.medicine_id, row.priority]));
  return (products || []).map((product) => ({
    ...product,
    sponsored: true,
    boost_priority: priorityMap.get(product.id) || 0
  }));
};

const applyBoostOrdering = (products, boosts) => {
  if (!boosts.length) return products;

  const boostMap = new Map(boosts.map((item) => [item.id, item.boost_priority]));
  const boosted = [];
  const regular = [];

  for (const product of products) {
    if (boostMap.has(product.id)) {
      boosted.push({ ...product, sponsored: true, boost_priority: boostMap.get(product.id) });
    } else {
      regular.push(product);
    }
  }

  boosted.sort((a, b) => (b.boost_priority || 0) - (a.boost_priority || 0));
  return [...boosted, ...regular];
};

const listPharmacyBoosts = async (pharmacyId) => {
  const { data, error } = await sdb
    .from("SponsoredBoost")
    .select("*, Medicine(id, name, price)")
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const createBoost = async ({ pharmacyId, medicineId, days = 7, priority = 1 }) => {
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + days);

  const { data: medicine, error: medError } = await sdb
    .from("Medicine")
    .select("id, pharmacy_id")
    .eq("id", medicineId)
    .eq("pharmacy_id", pharmacyId)
    .single();

  if (medError || !medicine) throw new Error("Product not found in your pharmacy");

  const { data, error } = await sdb
    .from("SponsoredBoost")
    .insert({
      pharmacy_id: pharmacyId,
      medicine_id: medicineId,
      priority,
      ends_at: endsAt.toISOString(),
      active: true
    })
    .select("*, Medicine(id, name, price)")
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const deactivateBoost = async (boostId, pharmacyId) => {
  const { data, error } = await sdb
    .from("SponsoredBoost")
    .update({ active: false })
    .eq("id", boostId)
    .eq("pharmacy_id", pharmacyId)
    .select()
    .single();

  if (error || !data) throw new Error("Boost not found");
  return data;
};

export {
  getActiveBoosts,
  applyBoostOrdering,
  listPharmacyBoosts,
  createBoost,
  deactivateBoost
};
