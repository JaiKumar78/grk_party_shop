// routes/productRoutes.js
import express from 'express';
// Import the new function and other existing functions
import { 
    listProducts, 
    removeProduct, 
    addProduct, 
    editProduct, 
    getProductByIdOrSlug // Changed import
} from '../controller/product.js'; // Assuming 'product.js' is your controller file
import { verifyAdmin } from '../middleware/admin.js';
import imgUpload from '../middleware/imgUpload.js';

const productRoutes = express.Router();

// GET all products
productRoutes.get('/', listProducts);

// GET single product by ID or SLUG (changed parameter name)
productRoutes.get('/:identifier', getProductByIdOrSlug); // Uses :identifier

// POST add a new product (Admin only)
productRoutes.post('/', verifyAdmin, imgUpload.any(), addProduct);

// PUT update a product by SLUG
productRoutes.put('/:slug', verifyAdmin, imgUpload.any(), editProduct);

// DELETE a product by SLUG
productRoutes.delete('/:slug', verifyAdmin, removeProduct);

export default productRoutes;
