import sdb from "./database.js";

const listFavorites = async (userId) => {
  const { data, error } = await sdb
    .from("Favorite")
    .select('medicine_id, created_at, Medicine(id, name, price, discount, average_rating, review_count, requires_prescription, stock, pharmacy_id, category, Pharmacy(id, name), Images(thumb_img))')
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

const addFavorite = async (userId, medicineId) => {
  const { data, error } = await sdb
    .from("Favorite")
    .insert([{ user_id: userId, medicine_id: medicineId }])
    .select("medicine_id")
    .single();

  if (error && error.code !== '23505') { // ignore unique constraint violation
    throw new Error(error.message);
  }
  return { success: true, medicine_id: medicineId };
};

const removeFavorite = async (userId, medicineId) => {
  const { error } = await sdb
    .from("Favorite")
    .delete()
    .eq("user_id", userId)
    .eq("medicine_id", medicineId);

  if (error) throw new Error(error.message);
  return { success: true };
};

export { listFavorites, addFavorite, removeFavorite };
