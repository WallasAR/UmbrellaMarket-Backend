import sdb from "./database.js";

const createOrderGroup = async (userId) => {
  const { data, error } = await sdb
    .from("OrderGroup")
    .insert({ user_id: userId, status: "pending_payment" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const updateOrderGroupStatus = async (orderGroupId) => {
  const { data: purchases, error } = await sdb
    .from("Purchase")
    .select("payment_status")
    .eq("order_group_id", orderGroupId);

  if (error || !purchases?.length) return;

  const allPaid = purchases.every((p) => p.payment_status === "paid");
  const anyPaid = purchases.some((p) => p.payment_status === "paid");
  const status = allPaid ? "paid" : anyPaid ? "partial" : "pending_payment";

  await sdb
    .from("OrderGroup")
    .update({ status })
    .eq("id", orderGroupId);
};

const listUserOrderGroups = async (userId) => {
  const { data: groups, error } = await sdb
    .from("OrderGroup")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!groups?.length) return [];

  const groupIds = groups.map((g) => g.id);
  const { data: purchases, error: purchaseError } = await sdb
    .from("Purchase")
    .select(`
      id,
      order_group_id,
      payment_status,
      order_status,
      total_price,
      pharmacy_id,
      fulfillment_mode,
      delivery_fee,
      created_at,
      Medicine (id, name, Images (thumb_img))
    `)
    .in("order_group_id", groupIds);

  if (purchaseError) throw new Error(purchaseError.message);

  const sessionsByGroup = {};
  for (const item of purchases || []) {
    const groupId = item.order_group_id;
    if (!sessionsByGroup[groupId]) sessionsByGroup[groupId] = {};

    if (!sessionsByGroup[groupId][item.id]) {
      sessionsByGroup[groupId][item.id] = {
        sessionId: item.id,
        payment_status: item.payment_status,
        order_status: item.order_status,
        fulfillment_mode: item.fulfillment_mode,
        delivery_fee: Number(item.delivery_fee || 0),
        total_price: 0,
        items: []
      };
    }
    sessionsByGroup[groupId][item.id].items.push(item);
    sessionsByGroup[groupId][item.id].total_price += Number(item.total_price || 0);
  }

  return groups.map((group) => {
    const sessions = Object.values(sessionsByGroup[group.id] || {});
    return {
      ...group,
      sessions,
      total_price: sessions.reduce((sum, s) => sum + s.total_price, 0),
      session_count: sessions.length
    };
  });
};

export { createOrderGroup, updateOrderGroupStatus, listUserOrderGroups };
