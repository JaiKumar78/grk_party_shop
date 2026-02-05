import express from 'express'
import { adminLogin, getSettings, updateSettings } from '../controller/admin.js'
import { verifyAdmin } from '../middleware/admin.js';
import { authLimiter } from '../middleware/security.js';

const adminRoutes  = express.Router()

adminRoutes.post('/login', authLimiter, adminLogin);

// Settings routes
adminRoutes.get('/settings', getSettings); // Public read access for consumer frontend
adminRoutes.put('/settings', verifyAdmin, updateSettings); // Admin-only write access

export default adminRoutes