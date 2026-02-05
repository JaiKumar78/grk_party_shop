import express from 'express';
import { createOrder, getAllOrders, getOrderbyId, getUserOrder, removeOrder, updateOrderStatus } from '../controller/order.js';
import { verifyAdmin } from '../middleware/admin.js';
import { verifyUser } from '../middleware/user.js';

const orderRoutes = express.Router();

orderRoutes.get('/', verifyAdmin, getAllOrders);
orderRoutes.get('/:orderId', getOrderbyId);
orderRoutes.get('/user', verifyUser, getUserOrder);
orderRoutes.post('/', createOrder);
orderRoutes.put('/:orderId', verifyAdmin, updateOrderStatus);

export default orderRoutes;