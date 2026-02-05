// routes/eventRoutes.js
import express from 'express';
import {
    createEvent,
    getAllEvents,
    getEventByIdOrSlug,
    updateEvent,
    deleteEvent
} from '../controller/event.js';
import { verifyAdmin } from '../middleware/admin.js'; // Assuming you have this middleware
import imgUpload from '../middleware/imgUpload.js';

const eventRoutes = express.Router();

// Public routes
eventRoutes.get('/', getAllEvents);
eventRoutes.get('/:idOrSlug', getEventByIdOrSlug);

// Admin-only routes
eventRoutes.post('/', verifyAdmin, imgUpload.single('image'), createEvent);
eventRoutes.put('/:id', verifyAdmin, imgUpload.single('image'), updateEvent);
eventRoutes.delete('/:id', verifyAdmin, deleteEvent);

export default eventRoutes;
