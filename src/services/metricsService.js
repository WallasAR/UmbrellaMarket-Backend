import sdb from "./database.js";

const uniqueSessions = (rows, statusFilter = null) => {
  const sessions = new Set();
  for (const row of rows || []) {
    if (statusFilter && row.payment_status !== statusFilter) continue;
    sessions.add(row.id);
  }
  return sessions.size;
};

const getPlatformMetrics = async (period = "30d") => {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const start = new Date();
  start.setDate(start.getDate() - days);

  const [purchases, carts, users, subscriptions] = await Promise.all([
    sdb.from("Purchase").select("id, payment_status, created_at, total_price").gte("created_at", start.toISOString()),
    sdb.from("Cart").select("id", { count: "exact", head: true }),
    sdb.from("User").select("id", { count: "exact", head: true }),
    sdb.from("Subscription").select("id, status", { count: "exact" })
  ]);

  const purchaseRows = purchases.data || [];
  const checkoutSessions = uniqueSessions(purchaseRows);
  const paidSessions = uniqueSessions(purchaseRows, "paid");
  const conversionRate = checkoutSessions > 0
    ? Number(((paidSessions / checkoutSessions) * 100).toFixed(1))
    : 0;

  const paidRevenue = purchaseRows
    .filter((row) => row.payment_status === "paid")
    .reduce((sum, row) => sum + Number(row.total_price || 0), 0);

  const activeSubscriptions = (subscriptions.data || []).filter((s) => s.status === "active").length;

  return {
    period,
    checkoutSessions,
    paidSessions,
    conversionRate,
    abandonedCarts: carts.count || 0,
    totalUsers: users.count || 0,
    paidRevenue,
    activeSubscriptions
  };
};

const getPharmacyMetrics = async (pharmacyId, period = "30d") => {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const start = new Date();
  start.setDate(start.getDate() - days);

  const [purchases, products] = await Promise.all([
    sdb.from("Purchase").select("id, payment_status, total_price, created_at")
      .eq("pharmacy_id", pharmacyId)
      .gte("created_at", start.toISOString()),
    sdb.from("Medicine").select("id, stock", { count: "exact" }).eq("pharmacy_id", pharmacyId)
  ]);

  const purchaseRows = purchases.data || [];
  const checkoutSessions = uniqueSessions(purchaseRows);
  const paidSessions = uniqueSessions(purchaseRows, "paid");
  const conversionRate = checkoutSessions > 0
    ? Number(((paidSessions / checkoutSessions) * 100).toFixed(1))
    : 0;

  const paidRevenue = purchaseRows
    .filter((row) => row.payment_status === "paid")
    .reduce((sum, row) => sum + Number(row.total_price || 0), 0);

  const lowStock = (products.data || []).filter((p) => p.stock <= 10).length;

  return {
    period,
    productCount: products.count || 0,
    lowStockProducts: lowStock,
    checkoutSessions,
    paidSessions,
    conversionRate,
    paidRevenue
  };
};

export { getPlatformMetrics, getPharmacyMetrics };
