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

const recordSponsoredClick = async ({ medicineId, userId, source = "listing" }) => {
  const now = new Date().toISOString();

  const { data: boost } = await sdb
    .from("SponsoredBoost")
    .select("id, pharmacy_id")
    .eq("medicine_id", medicineId)
    .eq("active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!boost) return null;

  const { data, error } = await sdb
    .from("SponsoredClick")
    .insert({
      boost_id: boost.id,
      pharmacy_id: boost.pharmacy_id,
      medicine_id: medicineId,
      user_id: userId || null,
      source
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const getBoostMetrics = async (pharmacyId, period = "30d") => {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const start = new Date();
  start.setDate(start.getDate() - days);

  const { data: clicks, error } = await sdb
    .from("SponsoredClick")
    .select("id, medicine_id, boost_id, source, created_at, Medicine(name)")
    .eq("pharmacy_id", pharmacyId)
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const byMedicine = {};
  for (const click of clicks || []) {
    const key = click.medicine_id;
    if (!byMedicine[key]) {
      byMedicine[key] = {
        medicine_id: key,
        medicine_name: click.Medicine?.name,
        clicks: 0
      };
    }
    byMedicine[key].clicks += 1;
  }

  return {
    period,
    total_clicks: (clicks || []).length,
    by_medicine: Object.values(byMedicine).sort((a, b) => b.clicks - a.clicks),
    recent: (clicks || []).slice(0, 20)
  };
};

export {
  getActiveBoosts,
  applyBoostOrdering,
  listPharmacyBoosts,
  createBoost,
  deactivateBoost,
  recordSponsoredClick,
  getBoostMetrics
};
