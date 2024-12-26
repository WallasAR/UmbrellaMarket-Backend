import {
  getCart,
  addProductToCart,
  updateCartProducts,
  deleteProductFromCart,
} from "../services/cartService.js"

// Util for validation of cart input
const validateCartInput = (userId, medicine_id, quantity) => {
  if (!userId || !medicine_id || quantity === undefined) {
    throw new Error("User, product, and quantity must be specified");
  }

  if (typeof medicine_id !== "number" || typeof quantity !== "number") {
    throw new Error("Product identifier and quantity must be integers");
  }
};


const listCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!userId) throw new Error("User Required");

    const card = await getCart(userId);

    res.status(200).json(card);
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { medicine_id, quantity } = req.body;

    validateCartInput(userId, medicine_id, quantity); 

    await addProductToCart(userId, medicine_id, quantity);

    res.status(201).json({message: "Product added successfully"});
  } catch (error) {
    next(error);
  }
};

const updateCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { medicine_id, quantity } = req.body;

    validateCartInput(userId, medicine_id, quantity); 

    await updateCartProducts(userId, medicine_id, quantity);

    res.status(200).json({ message: "Card updated successfully" })
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.id);

    if (!userId || !productId) throw new Error("User and product must be specified");

    await deleteProductFromCart(userId, productId); 

    res.status(200).json({ message: "Product removed successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  listCart,
  addToCart,
  updateCart,
  removeFromCart
};