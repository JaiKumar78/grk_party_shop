// routes/storeRoutes.js
import express from 'express';
import {
    createStore,
    getAllStores,
    getStoreById,
    updateStore,
    deleteStore,
} from '../controller/store.js';
import { verifyAdmin } from '../middleware/admin.js'; // Assuming your admin verification middleware

const storeRoutes = express.Router();

// Public routes (for fetching stores for user selection)
storeRoutes.get('/', getAllStores);
storeRoutes.get('/:id', getStoreById);

// Admin-only routes
storeRoutes.post('/', verifyAdmin, createStore);
storeRoutes.put('/:id', verifyAdmin, updateStore);
storeRoutes.delete('/:id', verifyAdmin, deleteStore);

export default storeRoutes;
