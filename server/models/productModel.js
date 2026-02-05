// models/productModel.js
import mongoose from "mongoose";

// Sub-schema for Product Variants
const variantSchema = new mongoose.Schema({
    sku: { // Stock Keeping Unit - Unique identifier for each variant
        type: String,
        required: true,
        // Note: unique constraint is handled at product schema level with sparse index
        trim: true,
        uppercase: true,
    },
    attributes: { // Key-value pairs for variant attributes (e.g., { color: 'Red', size: 'M' })
        type: Map, // Mongoose Map type allows flexible key-value pairs
        of: String, // Values are strings
        required: true,
    },
    price: { // Price for this specific variant
        type: Number,
        required: true,
        min: 0,
    },
    stock: { // Stock for this specific variant
        type: Number,
        required: true,
        min: 0,
    },
    images: [ // Images specific to this variant
        {
            url: { type: String, required: true },
            public_id: { type: String }
        }
    ],
});

// Add a pre-save hook for SKU uniqueness (more robust error handling than just unique: true)
variantSchema.pre('validate', async function(next) {
    if (this.isNew || this.isModified('sku')) {
        const Product = mongoose.models.Products || mongoose.model('Products', productSchema);
        // Find if any other product (or a different variant within the same product) has this SKU
        const existingProductWithSku = await Product.findOne({ 'variants.sku': this.sku });

        if (existingProductWithSku) {
            // Check if the found SKU belongs to the current variant being validated within its own product.
            // This is complex because 'this' refers to the subdocument.
            // For a robust check:
            const isDuplicate = existingProductWithSku.variants.some(v => {
                // If this variant has an _id, check if it's different from the existing variant
                if (this._id && v._id) {
                    return v.sku === this.sku && !v._id.equals(this._id);
                }
                // If this variant doesn't have an _id (new variant), check if SKU matches
                return v.sku === this.sku;
            });
            
            // Check if it's a different product
            const isDifferentProduct = this.parent() && this.parent()._id && 
                existingProductWithSku._id.toString() !== this.parent()._id.toString();
            
            if (isDuplicate || isDifferentProduct) {
                // If the SKU exists in a different variant or a different product
                return next(new Error(`Duplicate SKU found: ${this.sku}. Each variant SKU must be unique across all products.`));
            }
        }
    }
    next();
});


const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: { // Description at the product level, common to all variations
        type: [String], // Array of strings
        required: true,
        trim: true
    },
    // Top-level fields for simple products (optional)
    images: [
        {
            url: { type: String, required: true }, // Images for simple products
            public_id: { type: String }
        }
    ],
    price: { // Price for simple products
        type: Number,
        min: 0
    },
    stock: { // Stock for simple products
        type: Number,
        min: 0
    },

    productType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
        required: true
    },
    event: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Events',
        }],
        validate: {
            validator: function(v) {
                return v.length >= 0 && v.length <= 10;
            },
            message: 'A product can be associated with 0 to 10 events.'
        },
        required: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Optional: Variants array for complex products
    variants: {
        type: [variantSchema], // An array of variant sub-documents
        default: undefined // Ensures the array doesn't default to [] unless explicitly set
    }
});

// --- Custom Validation: Either simple product fields OR variants must be present, but not both ---
productSchema.pre('validate', function(next) {
    // Check for simple product fields (top-level price, stock, images)
    const hasPrice = this.price !== undefined && this.price !== null;
    const hasStock = this.stock !== undefined && this.stock !== null;
    const hasImages = this.images && Array.isArray(this.images) && this.images.length > 0;
    const hasSimpleFields = hasPrice || hasStock || hasImages;
    
    // Check for variants
    const hasVariants = this.variants && Array.isArray(this.variants) && this.variants.length > 0;

    // CRITICAL: A product CANNOT have both simple fields AND variants
    if (hasSimpleFields && hasVariants) {
        return next(new Error('A product cannot have both top-level price/stock/images and variants. Choose one type.'));
    }

    // A product MUST have either simple fields OR variants (not neither)
    if (!hasSimpleFields && !hasVariants) {
        return next(new Error('A product must have either top-level price/stock/images or at least one variant.'));
    }

    // If simple product, ensure ALL required simple fields are present
    if (hasSimpleFields) {
        if (!hasPrice || !hasStock || !hasImages) {
            return next(new Error('For a simple product, price, stock, and at least one image are required.'));
        }
        // Ensure variants are completely removed for simple products
        this.variants = undefined;
    }
    
    // If variant product, ensure NO simple fields are present
    if (hasVariants) {
        if (hasPrice || hasStock || hasImages) {
            return next(new Error('A product with variants cannot have top-level price, stock, or images. Variants must have their own price, stock, and images.'));
        }
        // Explicitly remove simple fields for variant products
        this.price = undefined;
        this.stock = undefined;
        this.images = undefined;
    }

    next();
});

// --- Automate Slug Generation ---
productSchema.pre('validate', function(next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = this.name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .trim();
    }
    next();
});

// --- Create sparse index for variants.sku to ensure uniqueness only when variants exist ---
// This index only applies to documents that have variants with sku values
// It prevents duplicate SKUs across all variant products without affecting simple products
// IMPORTANT: You may need to drop the existing index manually if it was created without sparse: true
// Run this in MongoDB shell: db.products.dropIndex('variants.sku_1')
productSchema.index({ 'variants.sku': 1 }, { 
    unique: true, 
    sparse: true,
    name: 'variants_sku_unique_sparse'
});

const productModel = mongoose.models.Products || mongoose.model('Products', productSchema);

export default productModel;
