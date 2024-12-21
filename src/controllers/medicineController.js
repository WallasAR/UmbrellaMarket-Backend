import { fetchProducts, fetchProduct } from '../services/medicineService.js';

const getProducts = async (req, res) => {
  try {
    const { discount, stock } = req.query;

    const products = await fetchProducts({ discount, stock });
    
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await fetchProduct(id);
    
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  };
};

export { getProducts, getProduct };