import sdb from "./database.js";

export const getSuggestions = async (term, userId, sessionId) => {
  if (!term || term.length < 3) return { terms: [], products: [] };

  // 1. Fetch fuzzy matched products
  const { data: productsData, error: productsError } = await sdb.rpc('fuzzy_search_medicine_ids', { search: term, result_limit: 5 });
  
  let products = [];
  if (!productsError && productsData?.length > 0) {
    const ids = productsData.map(p => p.id);
    const { data: meds } = await sdb.from('Medicine').select('id, name, price, discount, Images(thumb_img)').in('id', ids);
    products = meds || [];
  }

  // 2. Mock suggested terms based on product names (or we could fetch from popular searches in DB)
  let terms = [];
  if (products.length > 0) {
    terms = products.map(p => p.name.split(' ')[0].toLowerCase()).slice(0, 3);
    terms = [...new Set(terms)]; // unique terms
  } else {
    // Basic fallback suggestions if no products match perfectly yet
    terms = [term + " genérico", term + " gotas", term + " comprimido"];
  }

  return { terms, products };
};

export const saveSearchHistory = async (term, userId, sessionId) => {
  if (!term) return;
  await sdb.from('SearchHistory').insert([
    {
      term,
      user_id: userId || null,
      session_id: sessionId || null
    }
  ]);
};

export const getSearchHistory = async (userId, sessionId) => {
  let query = sdb.from('SearchHistory').select('term').order('created_at', { ascending: false }).limit(5);
  
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error || !data) return [];
  
  // Return unique terms
  return [...new Set(data.map(h => h.term))];
};
