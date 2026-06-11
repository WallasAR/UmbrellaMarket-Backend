import sdb from "./database.js";

export const getSuggestions = async (term, userId, sessionId, pharmacyId) => {
  if (!term || term.length < 3) return { terms: [], products: [], categories: [], brands: [] };

  // 1. Fetch fuzzy matched products
  const rpcParams = { search: term, result_limit: 5 };
  if (pharmacyId) {
    rpcParams.pharmacy_id_param = pharmacyId;
  }
  const { data: productsData, error: productsError } = await sdb.rpc('fuzzy_search_medicine_ids', rpcParams);
  
  let products = [];
  let categories = [];
  let brands = [];
  let terms = [];

  if (!productsError && productsData?.length > 0) {
    const ids = productsData.map(p => p.id);
    const query = sdb.from('Medicine')
                     .select('id, name, price, discount, active_ingredient, category, laboratory, Images(thumb_img)')
                     .in('id', ids);
    
    if (pharmacyId) {
      query.eq('pharmacy_id', pharmacyId);
    }
    
    const { data: meds } = await query;
    products = meds || [];
  }

  // 2. Extract Categories and Brands from matched products
  if (products.length > 0) {
    // Extract unique categories
    const allCats = products.map(p => p.category).filter(Boolean);
    categories = [...new Set(allCats)].slice(0, 3);

    // Extract unique brands (laboratories)
    const allLabs = products.map(p => p.laboratory).filter(Boolean);
    brands = [...new Set(allLabs)].slice(0, 3);

    // Extract intelligent terms based on active_ingredient and name
    const allTerms = products.flatMap(p => [
      p.name.split(' ')[0].toLowerCase(), 
      p.active_ingredient?.toLowerCase()
    ]).filter(Boolean);
    
    // Filter out terms that don't match the search prefix
    terms = [...new Set(allTerms)]
              .filter(t => t.includes(term.toLowerCase()))
              .slice(0, 4);
    
    // Fallback if filtering removed all
    if (terms.length === 0) {
      terms = [...new Set(allTerms)].slice(0, 3);
    }
  } else {
    // Basic fallback suggestions
    terms = [term + " genérico", term + " gotas", term + " comprimido"];
  }

  return { terms, products, categories, brands };
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
