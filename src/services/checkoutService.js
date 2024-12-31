import sdb from "./database.js";
import Stripe from "stripe";
import dotenv from "dotenv";
import { addProductToCart, deleteProductFromCart } from "./cartService.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_KEY);

const cartCheckoutSession = async (userId) => {
  const { data: cartItems, error: cartError } = await sdb
    .from("Cart")
    .select(`
      quantity,
      medicine_id,
      Medicine(name, price)
    `)
    .eq("user_id", userId);

  if (!cartItems || cartItems.length === 0) {
    throw new Error("Cart is empty");
  }

  if (cartError) {
    throw new Error(cartError.message);
  }

  const lineItems = cartItems.map((item) => ({
    price_data: {
      currency: "brl",
      product_data: {
        name: item.Medicine.name,
      },
      unit_amount: Math.round(item.Medicine.price * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.SUCCESS_URL}?sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.CANCEL_URL,
  });

  const purchaseData = cartItems.map((item) => ({
    id: session.id, 
    user_id: userId,
    medicine_id: item.medicine_id,
    quantity: item.quantity,
    total_price: item.Medicine.price * item.quantity,
    payment_status: "pending",
    payment_method: "Cartão de credito",
  }));

  const { error: purchaseError } = await sdb.from("Purchase").insert(purchaseData);

  if (purchaseError) {
    throw new Error(purchaseError.message);
  }

  return session.url;
};


const itemCheckoutSession = async (userId, productId, quantity) => {
  await addProductToCart(userId, productId, quantity);
  
  const { data, error } = await sdb
  .from("Cart")
  .select(`quantity, Medicine(name, price)`)
  .eq("user_id", userId)
  .eq("medicine_id", productId)
  .single();

  if (!data) { 
    throw new Error("Cart is empty");
  };

  if (error) {
    throw new Error(error.message);
  };

  const item = [{
    price_data: {
      currency: "brl",
      product_data: {
        name: data.Medicine.name,
      },
      unit_amount: Math.round(data.Medicine.price * 100),
    },
    quantity: data.quantity, 
  }];
  
  // Make the user say the payment method and pass it to the "payment_method_types" parameter in the future!
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: item,
    mode: "payment",
    success_url: `${process.env.SUCCESS_URL}?sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.CANCEL_URL,
  });

  const { error:failPurchase } = await sdb
  .from("Purchase")
  .insert({
    id: session.id, 
    user_id: userId, 
    medicine_id: productId, 
    quantity: data.quantity, 
    payment_method: "Cartão de credito", 
    total_price: data.Medicine.price * data.quantity
  })
  .eq("user_id", userId);

  if (failPurchase) {
    throw new Error(failPurchase.message);
  };

  return session.url; 
};

const updatePaymentStatus = async (sessionId) => {
  // Retrieves Stripe payment session
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const status = session.payment_status; // 'paid', 'unpaid', 'pending', etc.

  // Update the payment status in db
  await updatePurchaseStatus(sessionId, status);

  // If payment is completed, update stock and cart
  if (status === "paid") {
    await handleSuccessfulPayment(sessionId);
  }

  return status;
};

const updatePurchaseStatus = async (sessionId, status) => {
  const { error } = await sdb
    .from("Purchase")
    .update({ payment_status: status })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
};

const handleSuccessfulPayment = async (sessionId) => {
  const purchaseItems = await getPurchaseData(sessionId);

  for (const item of purchaseItems) {
    const stock = await getMedicineStock(item.medicine_id);

    await updateMedicineStock(item.medicine_id, stock - item.quantity);
    await deleteProductFromCart(item.user_id, item.medicine_id);
  }
};

const getPurchaseData = async (sessionId) => {
  const { data, error } = await sdb
    .from("Purchase")
    .select("user_id, medicine_id, quantity")
    .eq("id", sessionId);

  if (error || !data || data.length === 0) {
    throw new Error(`Failed to retrieve purchase data: ${error?.message || "Data not found"}`);
  }

  return data;
};

const getMedicineStock = async (medicineId) => {
  const { data, error } = await sdb
    .from("Medicine")
    .select("stock")
    .eq("id", medicineId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to retrieve medicine stock: ${error?.message || "Data not found"}`);
  }

  return data.stock;
};

const updateMedicineStock = async (medicineId, newStock) => {
  if (newStock < 0) {
    throw new Error("Stock cannot be negative");
  }

  const { error } = await sdb
    .from("Medicine")
    .update({ stock: newStock })
    .eq("id", medicineId);

  if (error) {
    throw new Error(`Failed to update medicine stock: ${error.message}`);
  }
};



export { cartCheckoutSession, itemCheckoutSession, updatePaymentStatus };