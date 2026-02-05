// controllers/categoryController.js
import categoryModel from "../models/categoryModel.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// @desc    Create a new category (product type)
// @route   POST /api/categories
// @access  Admin
export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        let imageUrl = undefined;
        let imagePublicId = undefined;
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'categories',
                public_id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
            });
            imageUrl = result.secure_url;
            imagePublicId = result.public_id;
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }

        const category = new categoryModel({ name, image: imageUrl });
        await category.save();

        res.status(201).json({ message: 'Product type category created successfully', category });
    } catch (error) {
        console.error("Error creating category:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category with this name or slug already exists.' });
        }
        res.status(400).json({ message: error.message || 'Error creating category' });
    }
};

// @desc    Get all categories (product types)
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
    try {
        const categories = await categoryModel.find().sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: error.message || 'Error fetching categories' });
    }
};

// @desc    Get category (product type) by ID or slug
// @route   GET /api/categories/:idOrSlug
// @access  Public
export const getCategoryByIdOrSlug = async (req, res) => {
    const { idOrSlug } = req.params;

    try {
        let category;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            category = await categoryModel.findById(idOrSlug);
        }

        if (!category) {
            category = await categoryModel.findOne({ slug: idOrSlug });
        }

        if (!category) {
            return res.status(404).json({ message: 'Category (product type) not found' });
        }

        res.status(200).json(category);
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ message: error.message || 'Error fetching category' });
    }
};

// @desc    Update a category (product type) by ID
// @route   PUT /api/categories/:id
// @access  Admin
export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const category = await categoryModel.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category (product type) not found' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        let imageUrl = category.image;
        let slug = category.slug;
        // If a new image is uploaded, upload to Cloudinary and delete old image
        if (req.file) {
            // Upload new image
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'categories',
                public_id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
            });
            imageUrl = result.secure_url;
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            // Delete old image from Cloudinary if present
            if (category.image) {
                const urlParts = category.image.split('/');
                const fileName = urlParts[urlParts.length - 1].split('.')[0];
                const publicId = `categories/${fileName}`;
                await deleteImageFromCloudinary(publicId);
            }
        }

        // If name changed, regenerate slug
        if (name !== category.name) {
            slug = name.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-')
                .trim();
        }

        category.name = name;
        category.slug = slug;
        category.image = imageUrl;
        await category.save();

        res.status(200).json({ message: 'Category (product type) updated successfully', category });
    } catch (error) {
        console.error("Error updating category:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category name or slug already exists.' });
        }
        res.status(400).json({ message: error.message || 'Error updating category' });
    }
};

// Helper to delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
            console.log(`Deleted image from Cloudinary: ${publicId}`);
        } catch (error) {
            console.error(`Failed to delete Cloudinary image ${publicId}:`, error);
        }
    }
};

// @desc    Delete a category (product type) by ID
// @route   DELETE /api/categories/:id
// @access  Admin
export const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const deletedCategory = await categoryModel.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category (product type) not found' });
        }

        // Delete image from Cloudinary if present
        if (deletedCategory.image) {
            // Extract public_id from the image URL if you store it, or store public_id in the DB for easier deletion
            // For now, try to extract from URL (assuming folder/name-timestamp)
            const urlParts = deletedCategory.image.split('/');
            const fileName = urlParts[urlParts.length - 1].split('.')[0];
            const publicId = `categories/${fileName}`;
            await deleteImageFromCloudinary(publicId);
        }

        res.status(200).json({ message: 'Category (product type) deleted successfully', category: deletedCategory });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: error.message || 'Error deleting category' });
    }
};
