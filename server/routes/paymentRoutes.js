// routes/paymentRoutes.js
import express from 'express';
import {
    processPayment,
    getMyOrders,
    getOrderById,
    updateOrderStatus, // Changed from updateOrderToDelivered
    getAllOrders,
} from '../controller/payment.js';
import { verifyUser } from '../middleware/user.js';
import { verifyAdmin } from '../middleware/admin.js';
import { authLimiter } from '../middleware/security.js';

const paymentRoutes = express.Router();

// --- User/Consumer Routes ---
paymentRoutes.post('/process-payment', authLimiter, processPayment);
paymentRoutes.get('/myorders', verifyUser, getMyOrders);
paymentRoutes.get('/orders/:orderId', getOrderById);

// --- Admin Routes ---
paymentRoutes.get('/orders', verifyAdmin, getAllOrders);
// CHANGED ROUTE: Now updates generic status instead of just 'delivered'
paymentRoutes.put('/orders/:orderId/status', verifyAdmin, updateOrderStatus); // New route for status update

export default paymentRoutes;
