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

const fuzzySearchProducts = async (q, { limit = 20 } = {}) => {
  const { data, error } = await sdb
    .from("Medicine")
    .select(PRODUCT_SELECT)
    .or(`name.ilike.%${q}%,active_ingredient.ilike.%${q}%,description.ilike.%${q}%`)
    .gt("stock", 0)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
};

export { listSymptoms, searchBySymptom, fuzzySearchProducts };
