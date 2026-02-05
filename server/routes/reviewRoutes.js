// routes/reviewRoutes.js
import express from 'express';
import {
    createReview,
    getReviewsForProduct,
    updateReview,
    deleteReview,
} from '../controller/review.js';
import { verifyAdmin } from '../middleware/admin.js'; // Assuming you have this for admin checks if needed globally on routes

const reviewRoutes = express.Router();

// Route to create a new review (PUBLIC - accessible by both authenticated and non-authenticated users)
reviewRoutes.post('/', createReview); // Removed protectUser middleware

// Route to get all reviews for a specific product (Public)
reviewRoutes.get('/:productId', getReviewsForProduct);

// Routes to update or delete a specific review (PRIVATE - requires user authentication, owner check in controller)
reviewRoutes.route('/:reviewId')
    .put(verifyAdmin, updateReview)
    .delete(verifyAdmin, deleteReview); // Admin can also delete (logic inside controller)

export default reviewRoutes;
