import { fetchProducts, fetchProduct } from '../services/medicineService.js';

const getProducts = async (req, res, next) => {
  try {
    const { discount, stock } = req.query;

    const products = await fetchProducts({ discount, stock });
    
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const product = await fetchProduct(id);
    
    res.status(200).json(product);
  } catch (error) {
    next(error);
  };
};

export { getProducts, getProduct };