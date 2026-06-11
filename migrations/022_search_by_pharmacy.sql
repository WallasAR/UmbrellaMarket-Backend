CREATE OR REPLACE FUNCTION fuzzy_search_medicine_ids(search text, result_limit int DEFAULT 20, pharmacy_id_param uuid DEFAULT NULL)
RETURNS TABLE(id int, score real)
LANGUAGE sql
STABLE
AS $$
  SELECT m.id,
    GREATEST(
      similarity(m.name, search),
      similarity(COALESCE(m.active_ingredient, ''), search),
      similarity(COALESCE(m.description, ''), search)
    ) AS score
  FROM "Medicine" m
  WHERE m.stock > 0
    AND (pharmacy_id_param IS NULL OR m.pharmacy_id = pharmacy_id_param)
    AND (
      m.name ILIKE '%' || search || '%'
      OR COALESCE(m.active_ingredient, '') ILIKE '%' || search || '%'
      OR similarity(m.name, search) > 0.15
      OR similarity(COALESCE(m.active_ingredient, ''), search) > 0.15
    )
  ORDER BY score DESC
  LIMIT result_limit;
$$;
