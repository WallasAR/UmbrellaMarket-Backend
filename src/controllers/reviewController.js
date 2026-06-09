import { listProductReviews, getProductRatingSummary, createReview } from "../services/reviewService.js";

const listReviews = async (req, res, next) => {
  try {
    const medicineId = Number(req.params.medicineId);
    const [reviews, summary] = await Promise.all([
      listProductReviews(medicineId),
      getProductRatingSummary(medicineId)
    ]);
    res.status(200).json({ reviews, summary });
  } catch (error) {
    next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const { medicine_id, rating, comment, pharmacy_id } = req.body;
    if (!medicine_id || !rating) throw new Error("Review data is required");

    const review = await createReview({
      userId: req.user.id,
      medicineId: Number(medicine_id),
      rating: Number(rating),
      comment,
      pharmacyId: pharmacy_id
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

export { listReviews, addReview };
