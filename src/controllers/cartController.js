import {
  getCart,
  addProductToCart,
  updateCartProducts,
  deleteProductFromCart,
} from "../services/cartService.js"

const listCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const card = await getCart(userId);

    res.status(200).json(card);
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const result = await addProductToCart(userId, productId, quantity);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    await updateCartProducts(userId, productId, quantity);

    res.status(200).json({ message: "Card updated successfully" })
  } catch (error) {
    res.status(500).json({ message: `${error.message}` });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params.id;

    await deleteProductFromCart(userId, productId);

    res.status(200).json({ message: "Product removed successfully" });
  } catch (error) {
    res.status(500).json({ message: `${error.message}` });
  }
};

export {
  listCart,
  addToCart,
  updateCart,
  removeFromCart
};