import sdb from "./database.js";
import { applyProductDiscount } from "../utils/pricing.js";
import { getActiveBoosts, applyBoostOrdering } from "./boostService.js";
import { listNearbyPharmacies } from "./pharmacyService.js";
import { fuzzySearchProducts } from "./symptomService.js";

const PRODUCT_SELECT = `
  *,
  Images!left(thumb_img),
  Pharmacy!left(id, name, city, latitude, longitude),
  average_rating,
  review_count
`;

const parseQueryBoolean = (value) => value === true || value === "true";

const applyInMemoryFilters = (products, filters) => {
  let result = products;

  if (parseQueryBoolean(filters.discount)) {
    result = result.filter((item) => Number(item.discount || 0) > 0);
  }
  if (parseQueryBoolean(filters.stock)) {
    result = result.filter((item) => Number(item.stock || 0) > 0);
  }
  if (filters.category) {
    result = result.filter((item) => item.category === filters.category);
  }
  if (filters.pharmacyId) {
    result = result.filter((item) => item.pharmacy_id === filters.pharmacyId);
  }
  if (filters.symptom) {
    const slug = filters.symptom.toLowerCase();
    result = result.filter((item) => (item.symptoms || []).includes(slug));
  }
  if (filters.minPrice) {
    result = result.filter((item) => Number(item.price) >= Number(filters.minPrice));
  }
  if (filters.maxPrice) {
    result = result.filter((item) => Number(item.price) <= Number(filters.maxPrice));
  }

  switch (filters.sort) {
    case "price_asc":
      result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "price_desc":
      result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case "discount_desc":
      result = [...result].sort((a, b) => Number(b.discount || 0) - Number(a.discount || 0));
      break;
    default:
      result = [...result].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  return result;
};

const finalizeProducts = async (products, { lat, lng, radiusKm, sort }) => {
  let result = products;

  if (lat != null && lng != null) {
    const nearby = await listNearbyPharmacies({
      lat: Number(lat),
      lng: Number(lng),
      radiusKm: Number(radiusKm || 15)
    });
    const nearbyIds = new Set(nearby.map((p) => p.id));
    result = result.filter((item) => nearbyIds.has(item.pharmacy_id));
    result.sort((a, b) => {
      const distA = nearby.find((p) => p.id === a.pharmacy_id)?.distance_km || 999;
      const distB = nearby.find((p) => p.id === b.pharmacy_id)?.distance_km || 999;
      return distA - distB;
    });
  }

  if (!sort || sort === "name_asc") {
    const boosts = await getActiveBoosts().catch(() => []);
    return applyBoostOrdering(result, boosts);
  }

  return result;
};

const fetchProducts = async (filters) => {
  const {
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
  } = filters;

  if (q) {
    const fuzzyResults = await fuzzySearchProducts(q, { limit: 80 });
    const filtered = applyInMemoryFilters(fuzzyResults, filters);
    return finalizeProducts(filtered, { lat, lng, radiusKm, sort });
  }

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

  return finalizeProducts(data || [], { lat, lng, radiusKm, sort });
};

const fetchProduct = async (id) => {
  const { data, error } = await sdb
    .from("Medicine")
    .select(`
      *,
      Images!left(thumb_img, primary_img, secondary_img, tertiary_img),
      Pharmacy!left(id, name, city, address),
      average_rating,
      review_count
    `)
    .eq("id", id)
    .single();

  if (data == null) throw new Error("Product not found");
  if (error) throw new Error(error.message);

  return data;
};

const listCategories = async (filters = {}) => {
  let query = sdb.from("Medicine").select("category");
  if (filters.pharmacyId) {
    query = query.eq("pharmacy_id", filters.pharmacyId);
  }
  
  const { data, error } = await query;
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

  let alternativesQuery = sdb
    .from("Medicine")
    .select(PRODUCT_SELECT)
    .ilike("active_ingredient", product.active_ingredient)
    .gt("stock", 0)
    .neq("id", productId);

  if (product.pharmacy_id) {
    alternativesQuery = alternativesQuery.eq("pharmacy_id", product.pharmacy_id);
  }

  const { data, error } = await alternativesQuery;

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
