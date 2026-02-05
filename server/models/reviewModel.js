// models/reviewModel.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', // Reference to your User model
        required: false, // Changed to false to allow reviews from non-signed-in users
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products', // Reference to your Product model
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 500, // Limit comment length
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Enforce unique review per *authenticated* user per product
// This index will now only apply if the 'user' field is present.
// For guest reviews (user: null), uniqueness will not be enforced by this index.
// If you need to prevent multiple guest reviews from the same "guest",
// you'd need to implement custom logic (e.g., based on IP address, temporary ID).
reviewSchema.index({ user: 1, product: 1 }, { unique: true, sparse: true }); // Added sparse: true

const reviewModel = mongoose.models.Reviews || mongoose.model('Reviews', reviewSchema);

export default reviewModel;
