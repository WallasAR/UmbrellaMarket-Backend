import { randomBytes } from "crypto";
import sdb from "./database.js";
import { createNotification } from "./notificationService.js";

const generatePickupCode = () => randomBytes(4).toString("hex").toUpperCase();

const createPickupForOrder = async ({ purchaseId, userId, pharmacyId }) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3);

  const pickupCode = generatePickupCode();

  const { data, error } = await sdb
    .from("PickupOrder")
    .insert({
      purchase_id: purchaseId,
      pharmacy_id: pharmacyId,
      user_id: userId,
      pickup_code: pickupCode,
      status: "ready",
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await createNotification({
    user_id: userId,
    title: "Retirada disponível",
    message: `Apresente o código ${pickupCode} no balcão da farmácia para retirar seu pedido.`,
    type: "pickup"
  });

  return data;
};

const getPickupByPurchase = async (purchaseId, userId = null) => {
  let query = sdb
    .from("PickupOrder")
    .select("*, Pharmacy(name, address, phone)")
    .eq("purchase_id", purchaseId);

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

const confirmPickup = async ({ pickupCode, pharmacyId, staffId }) => {
  const { data: pickup, error } = await sdb
    .from("PickupOrder")
    .select("*")
    .eq("pickup_code", pickupCode.toUpperCase())
    .eq("pharmacy_id", pharmacyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!pickup) {
    const notFound = new Error("Pickup code not found");
    notFound.status = 404;
    throw notFound;
  }

  if (pickup.status === "picked_up") {
    const already = new Error("Order already picked up");
    already.status = 400;
    throw already;
  }

  if (new Date(pickup.expires_at) < new Date()) {
    const expired = new Error("Pickup code expired");
    expired.status = 400;
    throw expired;
  }

  const { data, error: updateError } = await sdb
    .from("PickupOrder")
    .update({
      status: "picked_up",
      picked_up_at: new Date().toISOString(),
      confirmed_by: staffId
    })
    .eq("id", pickup.id)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  await sdb
    .from("Purchase")
    .update({ order_status: "delivered" })
    .eq("id", pickup.purchase_id);

  await createNotification({
    user_id: pickup.user_id,
    title: "Retirada confirmada",
    message: "Seu pedido foi entregue na farmácia. Obrigado pela compra!",
    type: "pickup"
  });

  return data;
};

const listPharmacyPickups = async (pharmacyId) => {
  const { data, error } = await sdb
    .from("PickupOrder")
    .select("*, User(email, name)")
    .eq("pharmacy_id", pharmacyId)
    .eq("status", "ready")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

export {
  createPickupForOrder,
  getPickupByPurchase,
  confirmPickup,
  listPharmacyPickups
};
