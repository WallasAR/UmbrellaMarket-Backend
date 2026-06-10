import sdb from "./database.js";
import { getDeliveryByPurchase } from "./deliveryService.js";
import { getPickupByPurchase } from "./pickupService.js";

const listUserOrders = async (userId) => {
  const { data, error } = await sdb
    .from("Purchase")
    .select(`
      id,
      user_id,
      medicine_id,
      quantity,
      total_price,
      payment_status,
      payment_method,
      order_status,
      pharmacy_id,
      fulfillment_mode,
      delivery_fee,
      order_group_id,
      created_at,
      Medicine (id, name, Images (thumb_img))
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const grouped = {};
  for (const item of data || []) {
    if (!grouped[item.id]) {
      grouped[item.id] = {
        sessionId: item.id,
        payment_status: item.payment_status,
        order_status: item.order_status || 'pending_payment',
        payment_method: item.payment_method,
        fulfillment_mode: item.fulfillment_mode || 'delivery',
        delivery_fee: Number(item.delivery_fee || 0),
        order_group_id: item.order_group_id || null,
        created_at: item.created_at,
        total_price: 0,
        items: []
      };
    }
    grouped[item.id].items.push(item);
    grouped[item.id].total_price += Number(item.total_price || 0);
  }

  const orders = Object.values(grouped);
  for (const order of orders) {
    if (order.fulfillment_mode === 'pickup') {
      order.pickup = await getPickupByPurchase(order.sessionId, userId);
    } else if (order.payment_status === 'paid') {
      order.delivery = await getDeliveryByPurchase(order.sessionId, userId);
    }
  }

  return orders;
};

const getUserOrder = async (userId, sessionId) => {
  const { data, error } = await sdb
    .from("Purchase")
    .select(`
      id,
      user_id,
      medicine_id,
      quantity,
      total_price,
      payment_status,
      payment_method,
      order_status,
      pharmacy_id,
      created_at,
      Medicine (id, name, Images (thumb_img))
    `)
    .eq("user_id", userId)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Order not found");

  return {
    sessionId,
    payment_status: data[0].payment_status,
    order_status: data[0].order_status || 'pending_payment',
    payment_method: data[0].payment_method,
    created_at: data[0].created_at,
    total_price: data.reduce((sum, item) => sum + Number(item.total_price || 0), 0),
    items: data
  };
};

const listAllOrders = async () => {
  const { data, error } = await sdb
    .from("Purchase")
    .select(`
      id,
      user_id,
      medicine_id,
      quantity,
      total_price,
      payment_status,
      order_status,
      created_at,
      Medicine (name),
      User (email, name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const grouped = {};
  for (const item of data || []) {
    if (!grouped[item.id]) {
      grouped[item.id] = {
        sessionId: item.id,
        user_id: item.user_id,
        user: item.User,
        payment_status: item.payment_status,
        order_status: item.order_status || 'pending_payment',
        created_at: item.created_at,
        total_price: 0,
        items: []
      };
    }
    grouped[item.id].items.push(item);
    grouped[item.id].total_price += Number(item.total_price || 0);
  }

  return Object.values(grouped);
};

const updateOrderStatus = async (sessionId, orderStatus) => {
  const { error } = await sdb
    .from("Purchase")
    .update({ order_status: orderStatus })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
};

export { listUserOrders, getUserOrder, listAllOrders, updateOrderStatus };
