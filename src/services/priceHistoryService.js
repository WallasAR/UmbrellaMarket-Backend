import sdb from "./database.js";
import { applyProductDiscount } from "../utils/pricing.js";

const recordPriceSnapshot = async ({ medicineId, pharmacyId, price, discount = 0, source = "manual" }) => {
  const finalPrice = applyProductDiscount(price, discount);

  const { data, error } = await sdb
    .from("PriceHistory")
    .insert({
      medicine_id: medicineId,
      pharmacy_id: pharmacyId,
      price,
      discount: discount || 0,
      final_price: finalPrice,
      source
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const getProductPriceHistory = async (medicineId, pharmacyId, period = "90d") => {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const start = new Date();
  start.setDate(start.getDate() - days);

  let query = sdb
    .from("PriceHistory")
    .select("*")
    .eq("medicine_id", medicineId)
    .gte("recorded_at", start.toISOString())
    .order("recorded_at", { ascending: true });

  if (pharmacyId) query = query.eq("pharmacy_id", pharmacyId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

const getPriceBenchmark = async (medicineId, pharmacyId) => {
  const { data: product, error: productError } = await sdb
    .from("Medicine")
    .select("id, name, price, discount, active_ingredient, pharmacy_id")
    .eq("id", medicineId)
    .single();

  if (productError || !product) throw new Error("Product not found");

  const myPrice = applyProductDiscount(product.price, product.discount);

  let competitorsQuery = sdb
    .from("Medicine")
    .select("id, price, discount, pharmacy_id, Pharmacy(name)")
    .gt("stock", 0);

  if (product.active_ingredient) {
    competitorsQuery = competitorsQuery.ilike("active_ingredient", product.active_ingredient);
  } else {
    competitorsQuery = competitorsQuery.eq("name", product.name);
  }

  const { data: competitors, error } = await competitorsQuery;
  if (error) throw new Error(error.message);

  const prices = (competitors || []).map((item) => ({
    medicine_id: item.id,
    pharmacy_id: item.pharmacy_id,
    pharmacy_name: item.Pharmacy?.name,
    final_price: applyProductDiscount(item.price, item.discount),
    is_mine: item.pharmacy_id === pharmacyId
  }));

  const competitorPrices = prices.filter((p) => !p.is_mine).map((p) => p.final_price);
  const marketAverage = competitorPrices.length
    ? competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length
    : myPrice;

  const cheapest = prices.length ? Math.min(...prices.map((p) => p.final_price)) : myPrice;

  return {
    product: { id: product.id, name: product.name, my_price: myPrice },
    market_average: Number(marketAverage.toFixed(2)),
    market_cheapest: Number(cheapest.toFixed(2)),
    position: myPrice <= cheapest ? "cheapest" : myPrice <= marketAverage ? "competitive" : "above_market",
    competitors: prices.sort((a, b) => a.final_price - b.final_price)
  };
};

export { recordPriceSnapshot, getProductPriceHistory, getPriceBenchmark };
