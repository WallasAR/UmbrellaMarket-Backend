import {
  getCart,
  addProductToCart,
  updateCartProducts,
  deleteProductFromCart,
  bulkAddToCart
} from "../services/cartService.js";

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

const bulkAdd = async (req, res, next) => {
  try {
    const result = await bulkAddToCart(req.user.id, req.body.items);
    res.status(200).json({
      message: `${result.added + result.updated} item(ns) processado(s)`,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export {
  listCart,
  addToCart,
  updateCart,
  removeFromCart,
  bulkAdd
};