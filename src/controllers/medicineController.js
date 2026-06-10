import { fetchProducts, fetchProduct, listCategories, fetchAlternatives } from '../services/medicineService.js';
import { getActiveBoosts, recordSponsoredClick } from '../services/boostService.js';

const getProducts = async (req, res, next) => {
  try {
    const {
      discount, stock, q, category, minPrice, maxPrice, pharmacyId, sort, symptom, lat, lng, radius_km
    } = req.query;
    const products = await fetchProducts({
      discount, stock, q, category, minPrice, maxPrice, pharmacyId, sort,
      symptom, lat, lng, radiusKm: radius_km
    });
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

const getAlternatives = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (typeof id !== "number" || isNaN(id)) throw Error("Invalid product");
    const data = await fetchAlternatives(id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getSponsored = async (_req, res, next) => {
  try {
    const products = await getActiveBoosts();
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

const postSponsoredClick = async (req, res, next) => {
  try {
    const medicineId = Number(req.params.id);
    const click = await recordSponsoredClick({
      medicineId,
      userId: req.user?.id,
      source: req.body.source || "listing"
    });

    if (!click) return res.status(404).json({ message: "No active sponsored boost for this product" });
    res.status(201).json(click);
  } catch (error) {
    next(error);
  }
};

export { getProducts, getProduct, getCategories, getAlternatives, getSponsored, postSponsoredClick };
