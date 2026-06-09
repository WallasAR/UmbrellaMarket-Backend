import sdb from "./database.js";
import { assertCanAddProduct } from "./planLimitService.js";

const createProduct = async (payload) => {
  const { images, ...medicine } = payload;

  if (medicine.pharmacy_id) {
    await assertCanAddProduct(medicine.pharmacy_id);
  }

  const { data, error } = await sdb
    .from("Medicine")
    .insert(medicine)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (images) {
    await sdb.from("Images").insert({ ...images, medicine_id: data.id });
  }

  return data;
};

const updateProduct = async (id, payload) => {
  const { images, ...medicine } = payload;

  const { data, error } = await sdb
    .from("Medicine")
    .update(medicine)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (images) {
    await sdb.from("Images").update(images).eq("medicine_id", id);
  }

  return data;
};

const deleteProduct = async (id) => {
  const { error } = await sdb.from("Medicine").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

const listUsers = async () => {
  const { data, error } = await sdb
    .from("User")
    .select("id, email, name, phone, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const updateUserRole = async (userId, role) => {
  const { error } = await sdb.from("User").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
};

const getDashboardStats = async () => {
  const [users, products, orders, prescriptions] = await Promise.all([
    sdb.from("User").select("id", { count: "exact", head: true }),
    sdb.from("Medicine").select("id", { count: "exact", head: true }),
    sdb.from("Purchase").select("id", { count: "exact", head: true }),
    sdb.from("Prescription").select("id", { count: "exact", head: true }).eq("status", "pending")
  ]);

  const lowStock = await sdb.from("Medicine").select("id, name, stock").lte("stock", 10);

  return {
    users: users.count || 0,
    products: products.count || 0,
    orders: orders.count || 0,
    pendingPrescriptions: prescriptions.count || 0,
    lowStock: lowStock.data || []
  };
};

export {
  createProduct,
  updateProduct,
  deleteProduct,
  listUsers,
  updateUserRole,
  getDashboardStats
};
