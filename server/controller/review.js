// controllers/reviewController.js
import reviewModel from "../models/reviewModel.js";
import productModel from "../models/productModel.js"; // To update product ratings
import mongoose from "mongoose";

// Helper function to update product ratings
const updateProductRatings = async (productId) => {
    try {
        const product = await productModel.findById(productId);
        if (!product) {
            console.error(`Product with ID ${productId} not found for rating update.`);
            return;
        }

        const reviews = await reviewModel.find({ product: productId });
        const totalReviews = reviews.length;
        const sumRatings = reviews.reduce((acc, review) => acc + review.rating, 0);
        const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

        product.ratings = {
            average: parseFloat(averageRating.toFixed(1)), // Round to 1 decimal place
            count: totalReviews,
        };

        await product.save();
        console.log(`Product ${productId} ratings updated: Avg=${product.ratings.average}, Count=${product.ratings.count}`);
    } catch (error) {
        console.error(`Error updating product ratings for ${productId}:`, error);
    }
};

// @desc    Create a new review for a product
// @route   POST /api/reviews
// @access  Public (accessible by both authenticated and non-authenticated users)
export const createReview = async (req, res) => {
    const { productId, rating, comment } = req.body;
    // req.user might be undefined if not authenticated, so only assign if available
    const userId = req.user?._id; // Optional chaining for user ID

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
    }
    if (comment && comment.length > 500) {
        return res.status(400).json({ message: 'Comment cannot exceed 500 characters.' });
    }

    try {
        const productExists = await productModel.findById(productId);
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // If user is authenticated, check if they have already reviewed this product
        if (userId) {
            const existingReview = await reviewModel.findOne({ user: userId, product: productId });
            if (existingReview) {
                return res.status(400).json({ message: 'You have already reviewed this product. You can update your existing review.' });
            }
        }
        // For guest reviews (userId is null/undefined), we do NOT enforce uniqueness here
        // based on the 'user' field, as multiple guests could theoretically submit.
        // If you need to prevent multiple guest reviews from the same "guest", you'd
        // need to add additional tracking (e.g., IP address, temporary client-side ID).

        const review = new reviewModel({
            user: userId, // Will be null if not authenticated
            product: productId,
            rating,
            comment,
        });

        await review.save();

        // Update product's average rating and review count
        await updateProductRatings(productId);

        res.status(201).json({ message: 'Review added successfully', review });
    } catch (error) {
        console.error("Error creating review:", error);
        // Handle unique index violation specifically for authenticated users
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already submitted a review for this product.' });
        }
        res.status(500).json({ message: error.message || 'Server Error: Could not add review' });
    }
};

// @desc    Get all reviews for a specific product
// @route   GET /api/reviews/:productId
// @access  Public
export const getReviewsForProduct = async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }

    try {
        const reviews = await reviewModel.find({ product: productId })
            .populate('user', 'name'); // Populate user's name for display (will be null if guest review)
        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error fetching reviews for product:", error);
        res.status(500).json({ message: error.message || 'Server Error: Could not fetch reviews' });
    }
};

// @desc    Update an existing review
// @route   PUT /api/reviews/:reviewId
// @access  Private (User - only owner can update)
export const updateReview = async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id; // User ID from authenticated middleware (required for this route)

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID.' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
    }
    if (comment && comment.length > 500) {
        return res.status(400).json({ message: 'Comment cannot exceed 500 characters.' });
    }

    try {
        const review = await reviewModel.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        // Ensure only the owner can update their review
        // This implicitly means guest reviews (review.user === null) cannot be updated via this route
        if (!review.user || review.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this review.' });
        }

        review.rating = rating;
        review.comment = comment || ''; // Allow clearing comment
        await review.save();

        // Update product's average rating after review update
        await updateProductRatings(review.product);

        res.status(200).json({ message: 'Review updated successfully', review });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ message: error.message || 'Server Error: Could not update review' });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (User - owner only) or Admin
export const deleteReview = async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user._id; // User ID from authenticated middleware (required for this route)
    const isAdmin = req.user.isAdmin; // Check if user is admin (assuming this field is on req.user)

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID.' });
    }

    try {
        const review = await reviewModel.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        // Allow deletion by admin, or by the owner of the review if it's not a guest review
        if (!isAdmin && (!review.user || review.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: 'Not authorized to delete this review.' });
        }

        await review.deleteOne();

        // Update product's average rating after review deletion
        await updateProductRatings(review.product);

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: error.message || 'Server Error: Could not delete review' });
    }
};
