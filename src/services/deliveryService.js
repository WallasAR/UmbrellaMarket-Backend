import sdb from "./database.js";
import { getDeliveryQuote } from "./courierService.js";
import { createNotification } from "./notificationService.js";

const DELIVERY_STATUS_FLOW = [
  "pending",
  "awaiting_driver",
  "picked_up",
  "in_transit",
  "delivered"
];

const quoteDeliveries = async ({ pharmacyIds, destLat, destLng, courier = "local" }) => {
  if (!pharmacyIds?.length) return [];

  const { data: pharmacies, error } = await sdb
    .from("Pharmacy")
    .select("id, name, latitude, longitude, address, city")
    .in("id", pharmacyIds);

  if (error) throw new Error(error.message);

  return (pharmacies || [])
    .filter((pharmacy) => pharmacy.latitude != null && pharmacy.longitude != null)
    .map((pharmacy) => {
      const quote = getDeliveryQuote(courier, {
        originLat: Number(pharmacy.latitude),
        originLng: Number(pharmacy.longitude),
        destLat,
        destLng
      });

      return {
        pharmacy_id: pharmacy.id,
        pharmacy_name: pharmacy.name,
        pharmacy_address: pharmacy.address,
        ...quote
      };
    });
};

const createDeliveryForOrder = async ({
  purchaseId,
  userId,
  pharmacyId,
  quotedPrice,
  etaMinutes,
  courier,
  destinationAddress,
  destLat,
  destLng
}) => {
  const { data, error } = await sdb
    .from("Delivery")
    .insert({
      purchase_id: purchaseId,
      pharmacy_id: pharmacyId,
      user_id: userId,
      courier: courier || "local",
      status: "awaiting_driver",
      quoted_price: quotedPrice,
      eta_minutes: etaMinutes,
      destination_address: destinationAddress,
      destination_lat: destLat,
      destination_lng: destLng
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await createNotification({
    user_id: userId,
    title: "Entrega agendada",
    message: `Seu pedido será entregue em até ${etaMinutes} minutos.`,
    type: "delivery"
  });

  return data;
};

const getDeliveryByPurchase = async (purchaseId, userId = null) => {
  let query = sdb
    .from("Delivery")
    .select("*, Pharmacy(name, address, phone)")
    .eq("purchase_id", purchaseId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

const advanceDeliveryStatus = async (deliveryId) => {
  const { data: delivery, error } = await sdb
    .from("Delivery")
    .select("*")
    .eq("id", deliveryId)
    .single();

  if (error || !delivery) throw new Error("Delivery not found");

  const currentIndex = DELIVERY_STATUS_FLOW.indexOf(delivery.status);
  const nextStatus = DELIVERY_STATUS_FLOW[Math.min(currentIndex + 1, DELIVERY_STATUS_FLOW.length - 1)];

  const { data, error: updateError } = await sdb
    .from("Delivery")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", deliveryId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  const statusMessages = {
    awaiting_driver: "Aguardando motorista",
    picked_up: "Pedido coletado na farmácia",
    in_transit: "Entrega a caminho",
    delivered: "Pedido entregue"
  };

  if (delivery.user_id && statusMessages[nextStatus]) {
    await createNotification({
      user_id: delivery.user_id,
      title: "Atualização da entrega",
      message: statusMessages[nextStatus],
      type: "delivery"
    });
  }

  if (nextStatus === "delivered" && delivery.purchase_id) {
    await sdb
      .from("Purchase")
      .update({ order_status: "delivered" })
      .eq("id", delivery.purchase_id);
  }

  return data;
};

const listPharmacyDeliveries = async (pharmacyId) => {
  const { data, error } = await sdb
    .from("Delivery")
    .select("*, User(email, name)")
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export {
  quoteDeliveries,
  createDeliveryForOrder,
  getDeliveryByPurchase,
  advanceDeliveryStatus,
  listPharmacyDeliveries
};
