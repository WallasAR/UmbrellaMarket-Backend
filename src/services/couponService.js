import sdb from "./database.js";

const getCouponByCode = async (code) => {
  const { data, error } = await sdb
    .from("Coupon")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("active", true)
    .single();

  if (error || !data) throw new Error("Invalid coupon");
  return data;
};

const validateCoupon = async (code, subtotal) => {
  const coupon = await getCouponByCode(code);

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new Error("Coupon expired");
  }

  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    throw new Error("Coupon usage limit reached");
  }

  if (subtotal < Number(coupon.min_order_value || 0)) {
    throw new Error("Order value below coupon minimum");
  }

  return coupon;
};

const incrementCouponUsage = async (code) => {
  const coupon = await getCouponByCode(code);
  const { error } = await sdb
    .from("Coupon")
    .update({ used_count: coupon.used_count + 1 })
    .eq("id", coupon.id);

  if (error) throw new Error(error.message);
};

const listCoupons = async () => {
  const { data, error } = await sdb.from("Coupon").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

const createCoupon = async (payload) => {
  const { data, error } = await sdb
    .from("Coupon")
    .insert({ ...payload, code: payload.code.toUpperCase() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export { validateCoupon, incrementCouponUsage, listCoupons, createCoupon, getCouponByCode };
