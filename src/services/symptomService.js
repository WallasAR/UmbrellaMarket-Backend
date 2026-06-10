import sdb from "./database.js";
import { listSymptoms, resolveSymptomTerms } from "../data/symptomMap.js";

const PRODUCT_SELECT = `
  *,
  Images!left(thumb_img),
  Pharmacy!left(id, name, city)
`;

const searchBySymptom = async (query, { limit = 20 } = {}) => {
  const terms = resolveSymptomTerms(query);
  const symptomSlug = query.toLowerCase().trim();

  let dbQuery = sdb
    .from("Medicine")
    .select(PRODUCT_SELECT)
    .gt("stock", 0);

  const orFilters = [
    `symptoms.cs.{${symptomSlug}}`,
    ...terms.map((term) => `name.ilike.%${term}%`),
    ...terms.map((term) => `active_ingredient.ilike.%${term}%`),
    ...terms.map((term) => `description.ilike.%${term}%`)
  ];

  dbQuery = dbQuery.or(orFilters.join(",")).limit(limit);

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  return {
    query,
    terms,
    results: data || []
  };
};

const fetchProductsByIds = async (ids) => {
  if (!ids.length) return [];

  const { data, error } = await sdb
    .from("Medicine")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .gt("stock", 0);

  if (error) throw new Error(error.message);

  const byId = new Map((data || []).map((item) => [item.id, item]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
};

const fuzzySearchProducts = async (q, { limit = 20 } = {}) => {
  const search = q?.trim();
  if (!search) return [];

  const { data: ranked, error: rpcError } = await sdb.rpc("fuzzy_search_medicine_ids", {
    search,
    result_limit: limit
  });

  if (!rpcError && ranked?.length) {
    const ids = ranked.map((row) => row.id);
    return fetchProductsByIds(ids);
  }

  const { data, error } = await sdb
    .from("Medicine")
    .select(PRODUCT_SELECT)
    .or(`name.ilike.%${search}%,active_ingredient.ilike.%${search}%,description.ilike.%${search}%`)
    .gt("stock", 0)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
};

export { listSymptoms, searchBySymptom, fuzzySearchProducts };
