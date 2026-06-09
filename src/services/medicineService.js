import sdb from "./database.js";

const fetchProducts = async ({ discount, stock, q, category, minPrice, maxPrice, pharmacyId, sort }) => {
  let query = sdb
    .from("Medicine")
    .select(`
      *,
      Images(thumb_img),
      Pharmacy(id, name, city)
    `);

  if (discount) query = query.gt("discount", 0);
  if (stock) query = query.gt("stock", 0);
  if (category) query = query.eq("category", category);
  if (pharmacyId) query = query.eq("pharmacy_id", pharmacyId);
  if (minPrice) query = query.gte("price", Number(minPrice));
  if (maxPrice) query = query.lte("price", Number(maxPrice));
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,active_ingredient.ilike.%${q}%`);

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
  return data;
};

const fetchProduct = async (id) => {
  const { data, error } = await sdb
    .from("Medicine")
    .select(`
      *,
      Images(thumb_img, primary_img, secondary_img, tertiary_img),
      Pharmacy(id, name, city, address)
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

export { fetchProducts, fetchProduct, listCategories };
