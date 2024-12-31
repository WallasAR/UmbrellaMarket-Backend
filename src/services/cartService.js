import sdb from "./database.js";

const getCart = async (userId) => {
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
  // Verifify that the product is already in the cart
  const { data:isInDb, error:fetchFail } = await sdb
  .from("Cart")
  .select("*")
  .eq("user_id", userId)
  .eq("medicine_id", productId)

  // If product is already in the cart, update the quantity
  if (isInDb.length > 0) {
    return await updateCartProducts(userId, productId, quantity);
  }

  // If product is not in the cart, add it to the cart
  const { error } = await sdb
    .from("Cart")
    .insert([
      { user_id: userId, medicine_id: productId, quantity: quantity }
    ])

  if (error || fetchFail) {
    throw new Error(error.message);
  }

  return;
};

const updateCartProducts = async (userId, productId, quantity) => {
  // get product quantity
  const { data:currentValue, error:fetchFail } = await sdb
  .from("Cart")
  .select("quantity")
  .eq("user_id", userId)
  .eq("medicine_id", productId)
  .single();

  if (!currentValue) {
    throw new Error("Product not found in the cart");
  }

  if (fetchFail) {
    throw new Error(fetchFail.message);
  }

  const updatedQuantity = quantity + currentValue.quantity;
  if (updatedQuantity < 0) {
    throw new Error("Quantity cannot be negative");
  }

  const { error } = await sdb
    .from("Cart")
    .update({ quantity: updatedQuantity })
    .eq("user_id", userId)
    .eq("medicine_id", productId)

  if (error) {
    throw new Error(error.message);
  }

  return;
};

const deleteProductFromCart = async (userId, productId) => {
  const { data, error } = await sdb
    .from("Cart")
    .delete()
    .eq("user_id", userId)
    .eq("medicine_id", productId)

  if (error) {
    throw new Error(error.message);
  };

  return;
};

export { 
  getCart, 
  addProductToCart, 
  updateCartProducts, 
  deleteProductFromCart 
};