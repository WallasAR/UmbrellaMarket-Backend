const applyProductDiscount = (price, discountPercent = 0) => {
  if (!discountPercent) return Number(price);
  return Number((price * (1 - discountPercent / 100)).toFixed(2));
};

const applyCouponDiscount = (subtotal, coupon) => {
  if (!coupon) return subtotal;

  if (coupon.discount_type === 'fixed') {
    return Math.max(0, Number((subtotal - coupon.discount_value).toFixed(2)));
  }

  return Number((subtotal * (1 - coupon.discount_value / 100)).toFixed(2));
};

const toStripeAmount = (value) => Math.round(Number(value) * 100);

export { applyProductDiscount, applyCouponDiscount, toStripeAmount };
