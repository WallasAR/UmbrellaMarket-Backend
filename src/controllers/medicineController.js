import { fetchProducts, fetchProduct, listCategories } from '../services/medicineService.js';

const getProducts = async (req, res, next) => {
  try {
    const { discount, stock, q, category, minPrice, maxPrice, pharmacyId, sort } = req.query;
    const products = await fetchProducts({ discount, stock, q, category, minPrice, maxPrice, pharmacyId, sort });
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (typeof id !== "number" || isNaN(id)) throw Error("Invalid product");
    const product = await fetchProduct(id);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await listCategories();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

export { getProducts, getProduct, getCategories };
