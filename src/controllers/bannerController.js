import { listActiveBanners } from "../services/bannerService.js";

const list = async (req, res, next) => {
  try {
    const banners = await listActiveBanners({
      category: req.query.category,
      limit: Number(req.query.limit) || 10,
      pharmacyId: req.query.pharmacyId
    });
    res.status(200).json(banners);
  } catch (error) {
    next(error);
  }
};

export { list };
