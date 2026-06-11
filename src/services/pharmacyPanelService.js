import sdb from "./database.js";
import { createNotification } from "./notificationService.js";
import { sendEmail } from "./emailService.js";
import { sendWhatsApp } from "./whatsappService.js";

const LOW_STOCK_THRESHOLD = 10;
const EXPIRY_WARNING_DAYS = 30;

const syncMedicineStock = async (medicineId, pharmacyId) => {
  const { data, error } = await sdb
    .from("MedicineBatch")
    .select("quantity")
    .eq("medicine_id", medicineId)
    .eq("pharmacy_id", pharmacyId);

  if (error) throw new Error(error.message);

  const total = (data || []).reduce((sum, batch) => sum + batch.quantity, 0);

  const { error: updateError } = await sdb
    .from("Medicine")
    .update({ stock: total })
    .eq("id", medicineId)
    .eq("pharmacy_id", pharmacyId);

  if (updateError) throw new Error(updateError.message);
  return total;
};

const getDashboard = async (pharmacyId) => {
  const [pharmacy, products, batches, orders] = await Promise.all([
    sdb.from("Pharmacy").select("*").eq("id", pharmacyId).single(),
    sdb.from("Medicine").select("id, name, stock").eq("pharmacy_id", pharmacyId),
    sdb.from("MedicineBatch").select("id, expiry_date, quantity").eq("pharmacy_id", pharmacyId),
    sdb.from("Purchase").select("id, order_status, total_price").eq("pharmacy_id", pharmacyId)
  ]);

  const lowStock = (products.data || []).filter((p) => p.stock <= LOW_STOCK_THRESHOLD);
  const expiringSoon = (batches.data || []).filter((b) => {
    const days = (new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= EXPIRY_WARNING_DAYS;
  });

  const paidOrders = (orders.data || []).filter((o) => o.order_status !== "pending_payment");
  const revenue = paidOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  return {
    pharmacy: pharmacy.data,
    productCount: products.data?.length || 0,
    batchCount: batches.data?.length || 0,
    orderCount: orders.data?.length || 0,
    revenue,
    lowStockCount: lowStock.length,
    expiringSoonCount: expiringSoon.length
  };
};

const listProducts = async (pharmacyId) => {
  const { data, error } = await sdb
    .from("Medicine")
    .select("id, name, price, discount, stock, category, requires_prescription, allows_subscription, description, active_ingredient, laboratory")
    .eq("pharmacy_id", pharmacyId)
    .order("name");

  if (error) throw new Error(error.message);
  return data || [];
};

const createProduct = async (pharmacyId, payload) => {
  const { images, ...medicine } = payload;
  const insertData = { ...medicine, pharmacy_id: pharmacyId, stock: medicine.stock ?? 0 };

  const { data, error } = await sdb
    .from("Medicine")
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const imagePayload = images || {
    thumb_img: "/defaultmed.png",
    primary_img: "/defaultmed.png"
  };

  await sdb.from("Images").insert({ ...imagePayload, medicine_id: data.id });
  return data;
};

const deleteProduct = async (pharmacyId, productId) => {
  const { data, error } = await sdb
    .from("Medicine")
    .select("id")
    .eq("id", productId)
    .eq("pharmacy_id", pharmacyId)
    .single();

  if (error || !data) throw new Error("Product not found");

  await sdb.from("Images").delete().eq("medicine_id", productId);
  await sdb.from("MedicineBatch").delete().eq("medicine_id", productId).eq("pharmacy_id", pharmacyId);

  const { error: deleteError } = await sdb
    .from("Medicine")
    .delete()
    .eq("id", productId)
    .eq("pharmacy_id", pharmacyId);

  if (deleteError) throw new Error(deleteError.message);
};

const updateProduct = async (pharmacyId, productId, payload) => {
  const { images, ...medicine } = payload;

  const { data, error } = await sdb
    .from("Medicine")
    .update(medicine)
    .eq("id", productId)
    .eq("pharmacy_id", pharmacyId)
    .select()
    .single();

  if (error || !data) throw new Error("Product not found");

  if (images) {
    await sdb.from("Images").update(images).eq("medicine_id", productId);
  }

  return data;
};

const listBatches = async (pharmacyId) => {
  const { data, error } = await sdb
    .from("MedicineBatch")
    .select("*, Medicine(id, name)")
    .eq("pharmacy_id", pharmacyId)
    .order("expiry_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

const createBatch = async (pharmacyId, payload) => {
  const { medicine_id, batch_number, quantity, expiry_date } = payload;

  const { data, error } = await sdb
    .from("MedicineBatch")
    .insert({
      pharmacy_id: pharmacyId,
      medicine_id,
      batch_number,
      quantity,
      expiry_date
    })
    .select("*, Medicine(name)")
    .single();

  if (error) throw new Error(error.message);

  await syncMedicineStock(medicine_id, pharmacyId);
  return data;
};

const updateBatch = async (pharmacyId, batchId, payload) => {
  const { data, error } = await sdb
    .from("MedicineBatch")
    .update(payload)
    .eq("id", batchId)
    .eq("pharmacy_id", pharmacyId)
    .select("*, Medicine(name)")
    .single();

  if (error) throw new Error(error.message);
  await syncMedicineStock(data.medicine_id, pharmacyId);
  return data;
};

const deleteBatch = async (pharmacyId, batchId) => {
  const { data, error } = await sdb
    .from("MedicineBatch")
    .select("medicine_id")
    .eq("id", batchId)
    .eq("pharmacy_id", pharmacyId)
    .single();

  if (error || !data) throw new Error("Batch not found");

  const { error: deleteError } = await sdb
    .from("MedicineBatch")
    .delete()
    .eq("id", batchId)
    .eq("pharmacy_id", pharmacyId);

  if (deleteError) throw new Error(deleteError.message);
  await syncMedicineStock(data.medicine_id, pharmacyId);
};

const getAlerts = async (pharmacyId) => {
  const [products, batches, staff] = await Promise.all([
    sdb.from("Medicine").select("id, name, stock").eq("pharmacy_id", pharmacyId).lte("stock", LOW_STOCK_THRESHOLD),
    sdb.from("MedicineBatch").select("id, batch_number, quantity, expiry_date, Medicine(name)")
      .eq("pharmacy_id", pharmacyId)
      .lte("expiry_date", new Date(Date.now() + EXPIRY_WARNING_DAYS * 86400000).toISOString().slice(0, 10)),
    sdb.from("User").select("id, email").eq("pharmacy_id", pharmacyId).in("role", ["pharmacist", "operator"])
  ]);

  return {
    lowStock: products.data || [],
    expiringBatches: batches.data || [],
    staffNotified: staff.data?.length || 0
  };
};

const notifyPharmacyStaff = async (pharmacyId, title, message) => {
  const { data: staff } = await sdb
    .from("User")
    .select("id, email, phone")
    .eq("pharmacy_id", pharmacyId)
    .in("role", ["pharmacist", "operator", "admin"]);

  for (const user of staff || []) {
    await createNotification({ user_id: user.id, title, message, type: "alert" });
    await sendEmail({ to: user.email, subject: title, text: message });
    if (user.phone && user.phone !== "Não definido") {
      await sendWhatsApp({ to: user.phone, message: `${title}: ${message}` });
    }
  }
};

const listPharmacyOrders = async (pharmacyId) => {
  const { data, error } = await sdb
    .from("Purchase")
    .select(`
      id,
      medicine_id,
      quantity,
      total_price,
      payment_status,
      order_status,
      created_at,
      Medicine(name)
    `)
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const grouped = {};
  for (const item of data || []) {
    if (!grouped[item.id]) {
      grouped[item.id] = {
        sessionId: item.id,
        payment_status: item.payment_status,
        order_status: item.order_status,
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

const updatePharmacyOrderStatus = async (pharmacyId, sessionId, orderStatus) => {
  const { error } = await sdb
    .from("Purchase")
    .update({ order_status: orderStatus })
    .eq("id", sessionId)
    .eq("pharmacy_id", pharmacyId);

  if (error) throw new Error(error.message);
};

const updateOperationalStatus = async (pharmacyId, operational_status) => {
  const { data, error } = await sdb
    .from("Pharmacy")
    .update({ operational_status })
    .eq("id", pharmacyId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const runAlertScan = async (pharmacyId) => {
  const alerts = await getAlerts(pharmacyId);

  if (alerts.lowStock.length) {
    await notifyPharmacyStaff(
      pharmacyId,
      "Estoque baixo",
      `${alerts.lowStock.length} medicamento(s) com estoque crítico.`
    );
  }

  if (alerts.expiringBatches.length) {
    await notifyPharmacyStaff(
      pharmacyId,
      "Lotes próximos do vencimento",
      `${alerts.expiringBatches.length} lote(s) vencem nos próximos ${EXPIRY_WARNING_DAYS} dias.`
    );
  }

  return alerts;
};

export {
  getDashboard,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getAlerts,
  listPharmacyOrders,
  updatePharmacyOrderStatus,
  updateOperationalStatus,
  runAlertScan,
  syncMedicineStock
};
