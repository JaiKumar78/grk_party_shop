// routes/user.js
import express from 'express'
import { sendOtp, verifyOtp, editUser, getUsers, removeUser, createOrFindUserFromOrder, getUserDataByEmail, getUserDataByPhone } from '../controller/user.js'
import { verifyAdmin } from '../middleware/admin.js';
import { verifyUser } from '../middleware/user.js'; // Assuming this middleware is still used for other user-specific actions
import { otpLimiter, authLimiter } from '../middleware/security.js';

const userRoutes = express.Router();

// New OTP authentication routes with rate limiting
userRoutes.post('/send-otp', otpLimiter, sendOtp);
userRoutes.post('/verify-otp', authLimiter, verifyOtp);

// Existing routes (unmodified login/signup removed)
userRoutes.get('/', verifyAdmin, getUsers);
userRoutes.put('/:userId', verifyUser, editUser);
userRoutes.delete('/:userId', verifyAdmin, removeUser);

// User data management routes
userRoutes.post('/create-from-order', createOrFindUserFromOrder); // Internal use for payment controller
userRoutes.get('/data/:email', getUserDataByEmail); // Public access for form pre-filling
userRoutes.get('/data/phone/:mobileNo', getUserDataByPhone); // Public access for form pre-filling by phone

export default userRoutes;
