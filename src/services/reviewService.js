import sdb from "./database.js";

const listProductReviews = async (medicineId) => {
  const { data, error } = await sdb
    .from("Review")
    .select("id, rating, comment, created_at, User(name, avatar)")
    .eq("medicine_id", medicineId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const getProductRatingSummary = async (medicineId) => {
  const reviews = await listProductReviews(medicineId);
  if (!reviews.length) return { average: 0, count: 0 };

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { average: Number(average.toFixed(1)), count: reviews.length };
};

const createReview = async ({ userId, medicineId, rating, comment, pharmacyId }) => {
  const { data, error } = await sdb
    .from("Review")
    .insert({
      user_id: userId,
      medicine_id: medicineId,
      pharmacy_id: pharmacyId || null,
      rating,
      comment
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export { listProductReviews, getProductRatingSummary, createReview };
