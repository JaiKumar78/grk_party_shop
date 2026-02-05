// models/categoryModel.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    image: {
        type: String,
        required: false,
        trim: true
    }
});

// --- Automate Slug Generation ---
categorySchema.pre('validate', function(next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = this.name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .trim();
    }
    next();
});

const categoryModel = mongoose.models.Categories || mongoose.model('Categories', categorySchema);

export default categoryModel;