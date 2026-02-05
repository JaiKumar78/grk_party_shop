// models/eventModel.js
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
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
eventSchema.pre('validate', function(next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = this.name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .trim();
    }
    next();
});

const eventModel = mongoose.models.Events || mongoose.model('Events', eventSchema);

export default eventModel;
