// routes/categoryRoutes.js
import express from 'express';
import {
    createCategory,
    getAllCategories,
    getCategoryByIdOrSlug,
    updateCategory,
    deleteCategory
} from '../controller/category.js';
import { verifyAdmin } from '../middleware/admin.js'; // Assuming you have this middleware
import imgUpload from '../middleware/imgUpload.js';

const categoryRoutes = express.Router();

// GET all categories
categoryRoutes.get('/', getAllCategories);

// GET single category by ID or slug
categoryRoutes.get('/:idOrSlug', getCategoryByIdOrSlug);

// POST add a new category (Admin only)
categoryRoutes.post('/', verifyAdmin, imgUpload.single('image'), createCategory);

// PUT update a category by ID (Admin only)
categoryRoutes.put('/:id', verifyAdmin, imgUpload.single('image'), updateCategory);

// DELETE a category by ID (Admin only)
categoryRoutes.delete('/:id', verifyAdmin, deleteCategory);

export default categoryRoutes;
