import express from 'express';
import { getProducts, getProduct } from '../controllers/medicineController.js';

const router = express.Router();

// Endpoints
router.get('/list', getProducts)
router.get('/:id', getProduct)

// ===================================

export default router;