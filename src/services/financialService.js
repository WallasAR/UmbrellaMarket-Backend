import sdb from "./database.js";

const PERIOD_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null
};

const getPeriodStart = (period) => {
  const days = PERIOD_DAYS[period] ?? PERIOD_DAYS["30d"];
  if (!days) return null;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start.toISOString();
};

const summarizePurchases = (rows, commissionRate = 0.1) => {
  let grossRevenue = 0;
  let platformFee = 0;
  let orderIds = new Set();

  for (const row of rows || []) {
    const amount = Number(row.total_price || 0);
    const fee = Number(row.platform_fee ?? amount * commissionRate);
    const net = Number(row.pharmacy_net ?? amount - fee);

    grossRevenue += amount;
    platformFee += fee;
    orderIds.add(row.id);
  }

  return {
    grossRevenue,
    platformFee,
    netRevenue: grossRevenue - platformFee,
    orderCount: orderIds.size,
    itemCount: rows?.length || 0
  };
};

const groupByDay = (rows) => {
  const days = {};

  for (const row of rows || []) {
    const day = (row.created_at || new Date().toISOString()).slice(0, 10);
    if (!days[day]) days[day] = { date: day, revenue: 0, orders: new Set() };
    days[day].revenue += Number(row.total_price || 0);
    days[day].orders.add(row.id);
  }

  return Object.values(days)
    .map((entry) => ({ date: entry.date, revenue: entry.revenue, orders: entry.orders.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const getPharmacyFinancials = async (pharmacyId, period = "30d") => {
  const { data: pharmacy } = await sdb
    .from("Pharmacy")
    .select("commission_rate, name")
    .eq("id", pharmacyId)
    .single();

  let query = sdb
    .from("Purchase")
    .select("id, total_price, platform_fee, pharmacy_net, created_at, payment_status")
    .eq("pharmacy_id", pharmacyId)
    .eq("payment_status", "paid");

  const periodStart = getPeriodStart(period);
  if (periodStart) query = query.gte("created_at", periodStart);

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const commissionRate = Number(pharmacy?.commission_rate ?? 0.1);

  return {
    pharmacy: pharmacy?.name,
    period,
    commissionRate,
    summary: summarizePurchases(data, commissionRate),
    daily: groupByDay(data)
  };
};

const getPlatformFinancials = async (period = "30d") => {
  const periodStart = getPeriodStart(period);

  let query = sdb
    .from("Purchase")
    .select("id, total_price, platform_fee, pharmacy_net, pharmacy_id, created_at, payment_status, Pharmacy(name, commission_rate)")
    .eq("payment_status", "paid");

  if (periodStart) query = query.gte("created_at", periodStart);

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const overall = summarizePurchases(data);

  const byPharmacy = {};
  for (const row of data || []) {
    const key = row.pharmacy_id || "unknown";
    if (!byPharmacy[key]) {
      byPharmacy[key] = {
        pharmacyId: key,
        pharmacyName: row.Pharmacy?.name || "Sem farmácia",
        grossRevenue: 0,
        platformFee: 0,
        orderIds: new Set()
      };
    }
    const amount = Number(row.total_price || 0);
    const rate = Number(row.Pharmacy?.commission_rate ?? 0.1);
    const fee = Number(row.platform_fee ?? amount * rate);

    byPharmacy[key].grossRevenue += amount;
    byPharmacy[key].platformFee += fee;
    byPharmacy[key].orderIds.add(row.id);
  }

  const pharmacies = Object.values(byPharmacy).map((entry) => ({
    pharmacyId: entry.pharmacyId,
    pharmacyName: entry.pharmacyName,
    grossRevenue: entry.grossRevenue,
    platformFee: entry.platformFee,
    netRevenue: entry.grossRevenue - entry.platformFee,
    orderCount: entry.orderIds.size
  }));

  return {
    period,
    summary: overall,
    daily: groupByDay(data),
    pharmacies: pharmacies.sort((a, b) => b.grossRevenue - a.grossRevenue)
  };
};

const recordPurchaseFees = async (sessionId, pharmacyId) => {
  const { data: pharmacy } = await sdb
    .from("Pharmacy")
    .select("commission_rate")
    .eq("id", pharmacyId)
    .maybeSingle();

  const rate = Number(pharmacy?.commission_rate ?? 0.1);

  const { data: items } = await sdb
    .from("Purchase")
    .select("medicine_id, total_price")
    .eq("id", sessionId)
    .eq("pharmacy_id", pharmacyId);

  for (const item of items || []) {
    const amount = Number(item.total_price || 0);
    const platformFee = Number((amount * rate).toFixed(2));
    const pharmacyNet = Number((amount - platformFee).toFixed(2));

    await sdb
      .from("Purchase")
      .update({ platform_fee: platformFee, pharmacy_net: pharmacyNet })
      .eq("id", sessionId)
      .eq("pharmacy_id", pharmacyId)
      .eq("medicine_id", item.medicine_id);
  }
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const buildPharmacyFinancialCsv = async (pharmacyId, period = "30d") => {
  const report = await getPharmacyFinancials(pharmacyId, period);
  const lines = [
    ["Farmácia", report.pharmacy, "Período", report.period].map(escapeCsv).join(","),
    ["Receita bruta", report.summary.grossRevenue, "Comissão", report.summary.platformFee, "Líquido", report.summary.netRevenue].map(escapeCsv).join(","),
    "",
    ["Data", "Receita", "Pedidos"].map(escapeCsv).join(",")
  ];

  for (const day of report.daily) {
    lines.push([day.date, day.revenue, day.orders].map(escapeCsv).join(","));
  }

  return lines.join("\n");
};

const buildPlatformFinancialCsv = async (period = "30d") => {
  const report = await getPlatformFinancials(period);
  const lines = [
    ["Relatório plataforma", "Período", report.period].map(escapeCsv).join(","),
    ["GMV", report.summary.grossRevenue, "Comissões", report.summary.platformFee, "Pedidos", report.summary.orderCount].map(escapeCsv).join(","),
    "",
    ["Farmácia", "Receita bruta", "Comissão", "Líquido", "Pedidos"].map(escapeCsv).join(",")
  ];

  for (const pharmacy of report.pharmacies) {
    lines.push([
      pharmacy.pharmacyName,
      pharmacy.grossRevenue,
      pharmacy.platformFee,
      pharmacy.netRevenue,
      pharmacy.orderCount
    ].map(escapeCsv).join(","));
  }

  return lines.join("\n");
};

export {
  getPharmacyFinancials,
  getPlatformFinancials,
  recordPurchaseFees,
  buildPharmacyFinancialCsv,
  buildPlatformFinancialCsv
};
