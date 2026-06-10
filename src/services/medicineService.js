import sdb from "./database.js";
import { applyProductDiscount } from "../utils/pricing.js";
import { getActiveBoosts, applyBoostOrdering } from "./boostService.js";
import { listNearbyPharmacies } from "./pharmacyService.js";

const PRODUCT_SELECT = `
  *,
  Images!left(thumb_img),
  Pharmacy!left(id, name, city, latitude, longitude)
`;

const parseQueryBoolean = (value) => value === true || value === "true";

const fetchProducts = async ({
  discount,
  stock,
  q,
  category,
  minPrice,
  maxPrice,
  pharmacyId,
  sort,
  symptom,
  lat,
  lng,
  radiusKm
}) => {
  let query = sdb
    .from("Medicine")
    .select(PRODUCT_SELECT);

  if (parseQueryBoolean(discount)) query = query.gt("discount", 0);
  if (parseQueryBoolean(stock)) query = query.gt("stock", 0);
  if (category) query = query.eq("category", category);
  if (pharmacyId) query = query.eq("pharmacy_id", pharmacyId);
  if (symptom) query = query.contains("symptoms", [symptom.toLowerCase()]);
  if (minPrice) query = query.gte("price", Number(minPrice));
  if (maxPrice) query = query.lte("price", Number(maxPrice));
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,description.ilike.%${q}%,active_ingredient.ilike.%${q}%`
    );
  }

  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "discount_desc":
      query = query.order("discount", { ascending: false });
      break;
    default:
      query = query.order("name", { ascending: true });
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  let products = data || [];

  if (lat != null && lng != null) {
    const nearby = await listNearbyPharmacies({
      lat: Number(lat),
      lng: Number(lng),
      radiusKm: Number(radiusKm || 15)
    });
    const nearbyIds = new Set(nearby.map((p) => p.id));
    products = products.filter((item) => nearbyIds.has(item.pharmacy_id));
    products.sort((a, b) => {
      const distA = nearby.find((p) => p.id === a.pharmacy_id)?.distance_km || 999;
      const distB = nearby.find((p) => p.id === b.pharmacy_id)?.distance_km || 999;
      return distA - distB;
    });
  }

  if (!sort || sort === "name_asc") {
    const boosts = await getActiveBoosts().catch(() => []);
    return applyBoostOrdering(products, boosts);
  }

  return products;
};

const fetchProduct = async (id) => {
  const { data, error } = await sdb
    .from("Medicine")
    .select(`
      *,
      Images!left(thumb_img, primary_img, secondary_img, tertiary_img),
      Pharmacy!left(id, name, city, address)
    `)
    .eq("id", id)
    .single();

  if (data == null) throw new Error("Product not found");
  if (error) throw new Error(error.message);

  return data;
};

const listCategories = async () => {
  const { data, error } = await sdb.from("Medicine").select("category");
  if (error) throw new Error(error.message);

  const categories = [...new Set((data || []).map((item) => item.category).filter(Boolean))];
  return categories.sort();
};

const computeFinalPrice = (medicine) =>
  applyProductDiscount(Number(medicine.price), Number(medicine.discount || 0));

const fetchAlternatives = async (productId) => {
  const product = await fetchProduct(productId);

  if (!product.active_ingredient) {
    return {
      product,
      alternatives: [],
      cheapest: null,
      savings_percent: 0
    };
  }

  const { data, error } = await sdb
    .from("Medicine")
    .select(PRODUCT_SELECT)
    .ilike("active_ingredient", product.active_ingredient)
    .gt("stock", 0)
    .neq("id", productId);

  if (error) throw new Error(error.message);

  const currentPrice = computeFinalPrice(product);
  const alternatives = (data || [])
    .map((item) => ({
      ...item,
      final_price: computeFinalPrice(item)
    }))
    .sort((a, b) => a.final_price - b.final_price);

  const cheapest = alternatives[0] || null;
  const cheapestGeneric = alternatives.find((item) => item.medicine_type === "generic") || cheapest;
  const savingsPercent = cheapest && currentPrice > 0
    ? Math.max(0, Math.round((1 - cheapest.final_price / currentPrice) * 100))
    : 0;

  return {
    product: { ...product, final_price: currentPrice },
    alternatives,
    cheapest,
    cheapest_generic: cheapestGeneric,
    savings_percent: savingsPercent
  };
};

export { fetchProducts, fetchProduct, listCategories, fetchAlternatives };
