// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to protect routes, ensuring only authenticated users can access
export const verifyUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // 1. Check for Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // console.log('ProtectUser: Authorization header missing or invalid format.');
        return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Check if token exists after splitting
    if (!token) {
        // console.log('ProtectUser: Token not found after splitting header.');
        return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    try {
        // 3. Verify token with JWT_SECRET
        const decoded = jwt.verify(token, JWT_SECRET);
        // console.log('ProtectUser: Token successfully decoded. User ID:', decoded.id);

        // 4. Find user by ID from the decoded token
        // Select all fields except password
        const user = await userModel.findById(decoded.id).select('-password');

        if (!user) {
            // console.log('ProtectUser: User not found for decoded ID:', decoded.id);
            return res.status(404).json({ message: 'User not found' });
        }

        // 5. Attach user object to the request for subsequent middleware/controllers
        req.user = user;
        // console.log('ProtectUser: User attached to request (ID:', req.user._id, '). Proceeding...');

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        // Handle various JWT errors (e.g., token expired, malformed token)
        // console.error('ProtectUser: Token verification failed:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};