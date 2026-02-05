// routes/cartRoutes.js
import express from 'express';
import {
  getUserCart,
  updateCart,
  clearUserCart,
} from '../controller/cart.js';
import { verifyUser } from '../middleware/user.js'; // Assuming your user authentication middleware

const cartRoutes = express.Router();

// All cart routes will be protected by user authentication
cartRoutes.route('/')
  .get(verifyUser, getUserCart)  // Get logged-in user's cart
  .put(verifyUser, updateCart)   // Update (sync) logged-in user's cart
  .delete(verifyUser, clearUserCart); // Clear logged-in user's cart

export default cartRoutes;
