import { getActiveLayout } from "../services/layoutService.js";

const getPublicLayout = async (req, res, next) => {
  try {
    // If pharmacyId is provided in query, fetch that specific layout
    const pharmacyId = req.query.pharmacy_id || null;
    const layout = await getActiveLayout(pharmacyId);
    res.status(200).json(layout);
  } catch (error) {
    next(error);
  }
};

export { getPublicLayout };
