import { validateCoupon } from "../services/couponService.js";

const validate = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await validateCoupon(code, Number(subtotal || 0));
    res.status(200).json(coupon);
  } catch (error) {
    next(error);
  }
};

export { validate };
