// controllers/productController.js
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import eventModel from "../models/eventModel.js";
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';
import mongoose from "mongoose"; // Keep mongoose import for ObjectId validation

// Helper function to safely parse potential JSON strings from FormData
const parseIfString = (value) => {
    try {
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
            return JSON.parse(value);
        }
        return value;
    } catch (e) {
        return value;
    }
};

// Helper for Cloudinary image upload (can be reused)
const uploadImagesToCloudinary = async (files, folderName, basePublicId) => {
    const uploadedImages = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: folderName,
                public_id: `${basePublicId}-${Date.now()}-${i}`
            });
            uploadedImages.push({
                url: result.secure_url,
                public_id: result.public_id
            });
        } catch (uploadError) {
            console.error(`Error uploading file ${file.originalname}:`, uploadError);
        } finally {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
    }
    return uploadedImages;
};

// Helper to delete images from Cloudinary
const deleteImagesFromCloudinary = async (publicIds) => {
    for (const publicId of publicIds) {
        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId);
                console.log(`Deleted image from Cloudinary: ${publicId}`);
            } catch (deleteError) {
                console.error(`Failed to delete Cloudinary image ${publicId}:`, deleteError);
            }
        }
    }
};

// --- Controller: Add Product (No change) ---
export const addProduct = async (req, res) => {
    const {
        name,
        description,
        productType,
        event,
        isFeatured,
        price,
        stock,
        variants
    } = req.body;

    const allUploadedFiles = req.files || [];

    try {
        const parsedDescription = parseIfString(description);
        const eventIds = parseIfString(event);
        const parsedVariants = parseIfString(variants);

        if (!name || !parsedDescription || parsedDescription.length === 0 || !productType || !eventIds) {
            return res.status(400).json({ message: 'Missing required product fields (name, description, productType, event).' });
        }
        if (!Array.isArray(eventIds) || eventIds.length > 5) {
            return res.status(400).json({ message: 'Event must be an array of 0 to 5 IDs.' });
        }
        if (!mongoose.Types.ObjectId.isValid(productType)) {
            return res.status(400).json({ message: 'Invalid productType ID provided.' });
        }
        for (const evtId of eventIds) {
            if (!mongoose.Types.ObjectId.isValid(evtId)) {
                return res.status(400).json({ message: `Invalid event ID: ${evtId}` });
            }
        }

        let productData = {
            name,
            description: parsedDescription,
            productType,
            event: eventIds,
            isFeatured: isFeatured === 'true',
        };

        // Determine product type from request
        const isVariantProductRequest = (parsedVariants && Array.isArray(parsedVariants) && parsedVariants.length > 0);
        const hasSimplePrice = price !== undefined && price !== null && price !== '';
        const hasSimpleStock = stock !== undefined && stock !== null && stock !== '';
        const hasSimpleImages = allUploadedFiles.length > 0 && !allUploadedFiles.some(file => file.fieldname.startsWith('variants['));
        const isSimpleProductRequest = hasSimplePrice || hasSimpleStock || hasSimpleImages;

        // CRITICAL VALIDATION: Cannot have both types
        if (isVariantProductRequest && isSimpleProductRequest) {
            return res.status(400).json({ message: 'A product cannot have both top-level price/stock/images and variants. Choose one type.' });
        }
        
        // Must have at least one type
        if (!isVariantProductRequest && !isSimpleProductRequest) {
            return res.status(400).json({ message: 'A product must have either top-level price/stock/images or at least one variant.' });
        }
        
        // Additional validation: If variants are present, ensure no simple fields are sent
        if (isVariantProductRequest && (hasSimplePrice || hasSimpleStock || hasSimpleImages)) {
            return res.status(400).json({ message: 'A product with variants cannot have top-level price, stock, or images. Variants must have their own price, stock, and images.' });
        }
        
        // Additional validation: If simple product, ensure all required fields are present
        if (isSimpleProductRequest && (!hasSimplePrice || !hasSimpleStock || !hasSimpleImages)) {
            return res.status(400).json({ message: 'For a simple product, price, stock, and at least one image are required.' });
        }

        if (isVariantProductRequest) {
            const productVariants = [];
            for (let i = 0; i < parsedVariants.length; i++) {
                const variantData = parsedVariants[i];
                const variantFiles = allUploadedFiles.filter(file => file.fieldname.startsWith(`variants[${i}].images`));

                if (!variantData.sku || variantData.attributes === undefined || variantData.price === undefined || variantData.stock === undefined) {
                    return res.status(400).json({ message: `Variant ${i} is missing required fields (sku, attributes, price, stock).` });
                }
                if (variantFiles.length === 0) {
                    return res.status(400).json({ message: `Variant ${i} requires at least one image.` });
                }

                const uploadedVariantImages = await uploadImagesToCloudinary(
                    variantFiles,
                    `products/${name.toLowerCase().replace(/\s+/g, '-')}/variants`,
                    `${name.toLowerCase().replace(/\s+/g, '-')}-${variantData.sku.toLowerCase()}`
                );

                productVariants.push({
                    sku: variantData.sku,
                    attributes: variantData.attributes,
                    price: parseFloat(variantData.price),
                    stock: parseInt(variantData.stock, 10),
                    images: uploadedVariantImages,
                });
            }
            productData.variants = productVariants;
            productData.price = undefined;
            productData.stock = undefined;
            productData.images = undefined;
        } else {
            if (allUploadedFiles.length === 0) {
                return res.status(400).json({ message: 'A simple product requires at least one image.' });
            }
            const uploadedMainImages = await uploadImagesToCloudinary(
                allUploadedFiles,
                `products/${name.toLowerCase().replace(/\s+/g, '-')}/main`,
                name.toLowerCase().replace(/\s+/g, '-')
            );
            productData.price = parseFloat(price);
            productData.stock = parseInt(stock, 10);
            productData.images = uploadedMainImages;
            productData.variants = undefined;
        }

        const product = new productModel(productData);
        await product.save();

        res.status(201).json({ message: 'Product added successfully', product });

    } catch (error) {
        console.error("Product creation failed:", error);
        if (allUploadedFiles.length > 0) {
             allUploadedFiles.forEach(file => {
                 if (fs.existsSync(file.path)) {
                     fs.unlinkSync(file.path);
                 }
             });
        }
        res.status(400).json({ message: error.message || 'Error adding product' });
    }
};

// --- Controller: Edit Product (Still identifies by SLUG as per previous request) ---
export const editProduct = async (req, res) => {
    const { slug: currentProductSlug } = req.params;
    const {
        name,
        description,
        productType,
        event,
        isFeatured,
        price,
        stock,
        existingImages: existingMainImagesStr,
        variants
    } = req.body;

    const allUploadedFiles = req.files || [];

    try {
        if (!currentProductSlug) {
            return res.status(400).json({ message: 'Product slug is required for editing.' });
        }

        const productToUpdate = await productModel.findOne({ slug: currentProductSlug });
        if (!productToUpdate) {
            return res.status(404).json({ message: 'Product not found with the provided slug.' });
        }

        const parsedDescription = parseIfString(description);
        const eventIds = parseIfString(event);
        const parsedVariants = parseIfString(variants);

        if (!Array.isArray(eventIds) || eventIds.length > 5) {
            return res.status(400).json({ message: 'Event must be an array of 0 to 5 IDs.' });
        }
        if (productType && !mongoose.Types.ObjectId.isValid(productType)) {
            return res.status(400).json({ message: 'Invalid productType ID provided.' });
        }
        for (const evtId of eventIds) {
            if (evtId && !mongoose.Types.ObjectId.isValid(evtId)) {
                return res.status(400).json({ message: `Invalid event ID: ${evtId}` });
            }
        }

        // Determine target product type from update request
        const isTargetVariantProduct = (parsedVariants && Array.isArray(parsedVariants) && parsedVariants.length > 0);
        const hasSimplePrice = price !== undefined && price !== null && price !== '';
        const hasSimpleStock = stock !== undefined && stock !== null && stock !== '';
        const existingMainImages = existingMainImagesStr ? parseIfString(existingMainImagesStr) : [];
        const hasExistingSimpleImages = Array.isArray(existingMainImages) && existingMainImages.length > 0;
        const hasNewSimpleImages = allUploadedFiles.some(file => !file.fieldname.startsWith('variants['));
        const isTargetSimpleProduct = hasSimplePrice || hasSimpleStock || hasExistingSimpleImages || hasNewSimpleImages;
        
        // CRITICAL VALIDATION: Cannot have both types
        if (isTargetVariantProduct && isTargetSimpleProduct) {
            return res.status(400).json({ message: 'A product cannot have both top-level price/stock/images and variants. Choose one type.' });
        }
        
        // Must have at least one type
        if (!isTargetVariantProduct && !isTargetSimpleProduct) {
            return res.status(400).json({ message: 'No valid product data provided for update. Product must have either top-level price/stock/images or at least one variant.' });
        }
        
        // Additional validation: If variants are present, ensure no simple fields are sent
        if (isTargetVariantProduct && (hasSimplePrice || hasSimpleStock || hasExistingSimpleImages || hasNewSimpleImages)) {
            return res.status(400).json({ message: 'A product with variants cannot have top-level price, stock, or images. Variants must have their own price, stock, and images.' });
        }
        
        // Additional validation: If simple product, ensure all required fields are present
        if (isTargetSimpleProduct && (!hasSimplePrice || !hasSimpleStock || (!hasExistingSimpleImages && !hasNewSimpleImages))) {
            return res.status(400).json({ message: 'For a simple product, price, stock, and at least one image are required.' });
        }

        let updateData = {
            name,
            description: parsedDescription,
            productType,
            event: eventIds,
            isFeatured: isFeatured === 'true',
        };

        const publicIdsToClearFromCloudinary = new Set();
        if (productToUpdate.images && productToUpdate.images.length > 0) {
            productToUpdate.images.forEach(img => publicIdsToClearFromCloudinary.add(img.public_id));
        }
        if (productToUpdate.variants && productToUpdate.variants.length > 0) {
             productToUpdate.variants.forEach(v => v.images.forEach(img => publicIdsToClearFromCloudinary.add(img.public_id)));
        }

        const publicIdsToKeepAfterUpdate = new Set();

        if (isTargetVariantProduct) {
            const updatedProductVariants = [];
            for (let i = 0; i < parsedVariants.length; i++) {
                const variantData = parsedVariants[i];
                const variantFiles = allUploadedFiles.filter(file => file.fieldname.startsWith(`variants[${i}].images`));
                const existingVariantImages = parseIfString(variantData.existingImages || '[]');

                if (!variantData.sku || variantData.attributes === undefined || variantData.price === undefined || variantData.stock === undefined) {
                    return res.status(400).json({ message: `Variant ${i} is missing required fields (sku, attributes, price, stock).` });
                }

                let newVariantImages = [];
                if (Array.isArray(existingVariantImages)) {
                    newVariantImages = existingVariantImages;
                    existingVariantImages.forEach(img => {
                        if (img.public_id) publicIdsToKeepAfterUpdate.add(img.public_id);
                    });
                }

                if (variantFiles.length > 0) {
                    const uploadedNewImages = await uploadImagesToCloudinary(
                        variantFiles,
                        `products/${name.toLowerCase().replace(/\s+/g, '-')}/variants`,
                        `${name.toLowerCase().replace(/\s+/g, '-')}-${variantData.sku.toLowerCase()}`
                    );
                    newVariantImages.push(...uploadedNewImages);
                    uploadedNewImages.forEach(img => publicIdsToKeepAfterUpdate.add(img.public_id));
                }

                if (newVariantImages.length === 0) {
                    return res.status(400).json({ message: `Variant ${i} requires at least one image.` });
                }

                updatedProductVariants.push({
                    ...(variantData._id && { _id: variantData._id }),
                    sku: variantData.sku,
                    attributes: variantData.attributes,
                    price: parseFloat(variantData.price),
                    stock: parseInt(variantData.stock, 10),
                    images: newVariantImages,
                });
            }
            updateData.variants = updatedProductVariants;
            updateData.price = undefined;
            updateData.stock = undefined;
            updateData.images = undefined;

        } else {
            // Reuse existingMainImages parsed earlier in validation
            let newMainImages = [];
            if (Array.isArray(existingMainImages)) {
                newMainImages = existingMainImages;
                existingMainImages.forEach(img => {
                    if (img.public_id) publicIdsToKeepAfterUpdate.add(img.public_id);
                });
            }

            if (allUploadedFiles.length > 0) {
                const uploadedNewImages = await uploadImagesToCloudinary(
                    allUploadedFiles,
                    `products/${name.toLowerCase().replace(/\s+/g, '-')}/main`,
                    name.toLowerCase().replace(/\s+/g, '-')
                );
                newMainImages.push(...uploadedNewImages);
                uploadedNewImages.forEach(img => publicIdsToKeepAfterUpdate.add(img.public_id));
            }

            if (newMainImages.length === 0) {
                return res.status(400).json({ message: 'A simple product requires at least one image.' });
            }

            updateData.price = parseFloat(price);
            updateData.stock = parseInt(stock, 10);
            updateData.images = newMainImages;
            updateData.variants = undefined;
        }

        const publicIdsToDeleteFinal = Array.from(publicIdsToClearFromCloudinary).filter(id => !publicIdsToKeepAfterUpdate.has(id));
        await deleteImagesFromCloudinary(publicIdsToDeleteFinal);

        const updatedProduct = await productModel.findOneAndUpdate({ slug: currentProductSlug }, updateData, { new: true, runValidators: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found after attempted update by slug.' });
        }

        res.json({ message: 'Product updated', product: updatedProduct });

    } catch (error) {
        console.error("Error updating product:", error);
        if (allUploadedFiles.length > 0) {
             allUploadedFiles.forEach(file => {
                 if (fs.existsSync(file.path)) {
                     fs.unlinkSync(file.path);
                 }
             });
        }
        res.status(400).json({ message: error.message || 'Error updating product' });
    }
};

// --- Controller: Remove Product (Still identifies by SLUG as per previous request) ---
export const removeProduct = async (req, res) => {
    const { slug } = req.params;

    try {
        if (!slug) {
            return res.status(400).json({ message: 'Product slug is required for deletion.' });
        }

        const deletedProduct = await productModel.findOneAndDelete({ slug: slug });
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found with the provided slug.' });
        }

        const publicIdsToDelete = [];
        if (deletedProduct.images && deletedProduct.images.length > 0) {
            deletedProduct.images.forEach(img => publicIdsToDelete.push(img.public_id));
        }
        if (deletedProduct.variants && deletedProduct.variants.length > 0) {
            deletedProduct.variants.forEach(v => v.images.forEach(img => publicIdsToDelete.push(img.public_id)));
        }
        await deleteImagesFromCloudinary(publicIdsToDelete);

        res.status(200).json({ message: 'Product deleted', product: deletedProduct });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

// --- Controller: List Products (No change) ---
export const listProducts = async (req, res) => {
    try {
        const { search, productType, event, stockStatus, sortBy, isFeatured, minPrice, maxPrice, attribute } = req.query;

        let query = {};
        let sort = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { name: searchRegex },
                { 'description': searchRegex },
                { 'variants.sku': searchRegex },
            ];
        }

        if (productType) {
            // Check if it's a valid ObjectId first
            if (mongoose.Types.ObjectId.isValid(productType)) {
                query.productType = productType;
            } else {
                // If not an ObjectId, treat it as a slug and find the category by slug
                const category = await categoryModel.findOne({ slug: productType });
                if (category) {
                    query.productType = category._id;
                }
            }
        }

        if (event) {
            // Check if it's a valid ObjectId first
            if (mongoose.Types.ObjectId.isValid(event)) {
                query.event = { $in: [event] };
            } else {
                // If not an ObjectId, treat it as a slug and find the event by slug
                const eventDoc = await eventModel.findOne({ slug: event });
                if (eventDoc) {
                    query.event = { $in: [eventDoc._id] };
                }
            }
        }

        if (stockStatus) {
            if (stockStatus === 'inStock') {
                query.$or = [
                    { stock: { $gt: 0 } },
                    { 'variants.stock': { $gt: 0 } }
                ];
            } else if (stockStatus === 'lessThan10') {
                query.$or = [
                    { stock: { $lte: 10, $gt: 0 } },
                    { 'variants.stock': { $lte: 10, $gt: 0 } }
                ];
            }else if (stockStatus === 'outOfStock') {
                query.$or = [
                    { stock: { $lte: 0 } },
                    { 'variants.stock': { $lte: 0 } }
                ];
            }
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceFilter = {};
            if (minPrice !== undefined) priceFilter.$gte = parseFloat(minPrice);
            if (maxPrice !== undefined) priceFilter.$lte = parseFloat(maxPrice);
            query.$or = [
                { price: priceFilter },
                { 'variants.price': priceFilter }
            ];
        }

        if (attribute) {
            try {
                const parsedAttribute = JSON.parse(attribute);
                const attrKey = Object.keys(parsedAttribute)[0];
                const attrValue = parsedAttribute[attrKey];
                if (attrKey && attrValue) {
                    query[`variants.attributes.${attrKey}`] = attrValue;
                }
            } catch (e) {
                console.warn('Invalid attribute query parameter:', attribute);
            }
        }

        if (isFeatured !== undefined) {
            query.isFeatured = isFeatured === 'true';
        }

        switch (sortBy) {
            case 'name-asc':
                sort.name = 1;
                break;
            case 'name-desc':
                sort.name = -1;
                break;
            case 'price-low-high':
                sort.price = 1;
                sort['variants.price'] = 1;
                break;
            case 'price-high-low':
                sort.price = -1;
                sort['variants.price'] = -1;
                break;
            case 'stock-low-high':
                sort.stock = 1;
                sort['variants.stock'] = 1;
                break;
            case 'stock-high-low':
                sort.stock = -1;
                sort['variants.stock'] = -1;
                break;
            case 'featured-first':
                sort.isFeatured = -1; // -1 for descending (true first)
                break;
            case 'non-featured-first':
                sort.isFeatured = 1; // 1 for ascending (false first)
                break;
            case 'oldest':
                sort.createdAt = 1;
                break;
            case 'newest':
            default:
                sort.createdAt = -1;
                break;
        }

        const products = await productModel.find(query)
            .populate('productType', 'name slug')
            .populate('event', 'name slug')
            .sort(sort);

        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

// --- New Controller: Get Product By ID or Slug ---
export const getProductByIdOrSlug = async (req, res) => {
    const { identifier } = req.params; // This parameter can be an ID or a slug

    try {
        if (!identifier) {
            return res.status(400).json({ message: 'Product identifier (ID or slug) is required.' });
        }

        let product = null;

        // Check if the identifier is a valid MongoDB ObjectId format
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            // Try to find by _id first
            product = await productModel.findById(identifier)
                .populate('productType', 'name slug')
                .populate('event', 'name slug');
        }

        // If not found by ID or if the identifier was not an ObjectId, try by slug
        if (!product) {
            product = await productModel.findOne({ slug: identifier })
                .populate('productType', 'name slug')
                .populate('event', 'name slug');
        }

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error("Error fetching product by ID or slug:", error);
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};
