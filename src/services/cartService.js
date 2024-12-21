import sdb from "./database.js";

const getCart = async (userId) => {
  if (!userId) throw new Error("User Required");

  const { data, error } = await sdb
    .from("Cart")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const addProductToCart = async (userId, productId, quantity) => {
  if (!userId || !productId || quantity == undefined) throw new Error("User, product and quantity must be specified"); 

  const { data, error } = await sdb
    .from("Cart")
    .insert([
      { user_id: userId, medicine_id: productId, quantity: quantity }
    ])

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const updateCartProducts = async (userId, productId, quantity) => {
  if (!userId || !productId || quantity == undefined) throw new Error("User, product and quantity must be specified");
  const { data, error } = await sdb
    .from("Cart")
    .update({ quantity: quantity })
    .eq("user_id", userId)
    .eq("medicine_id", productId)

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const deleteProductFromCart = async (userId, productId) => {
  if (!userId || !productId) throw new Error("User and product must be specified");

  const { data, error } = await sdb
    .from("Cart")
    .delete()
    .eq("user_id", userId)
    .eq("medicine_id", productId)

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export { 
  getCart, 
  addProductToCart, 
  updateCartProducts, 
  deleteProductFromCart 
};