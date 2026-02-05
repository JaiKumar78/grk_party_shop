// controllers/eventController.js
import eventModel from "../models/eventModel.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// @desc    Create a new event
// @route   POST /api/events
// @access  Admin
export const createEvent = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Event name is required" });
        }

        let imageUrl = undefined;
        let imagePublicId = undefined;
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'events',
                public_id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
            });
            imageUrl = result.secure_url;
            imagePublicId = result.public_id;
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }

        const event = new eventModel({ name, image: imageUrl });
        await event.save();

        res.status(201).json({ message: 'Event created successfully', event });
    } catch (error) {
        console.error("Error creating event:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Event with this name or slug already exists.' });
        }
        res.status(400).json({ message: error.message || 'Error creating event' });
    }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getAllEvents = async (req, res) => {
    try {
        const events = await eventModel.find().sort({ name: 1 });
        res.status(200).json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: error.message || 'Error fetching events' });
    }
};

// @desc    Get event by ID or slug
// @route   GET /api/events/:idOrSlug
// @access  Public
export const getEventByIdOrSlug = async (req, res) => {
    const { idOrSlug } = req.params;

    try {
        let event;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            event = await eventModel.findById(idOrSlug);
        }

        if (!event) {
            event = await eventModel.findOne({ slug: idOrSlug });
        }

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: error.message || 'Error fetching event' });
    }
};

// @desc    Update an event by ID
// @route   PUT /api/events/:id
// @access  Admin
export const updateEvent = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Event name is required' });
        }

        let imageUrl = event.image;
        let slug = event.slug;
        // If a new image is uploaded, upload to Cloudinary and delete old image
        if (req.file) {
            // Upload new image
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'events',
                public_id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
            });
            imageUrl = result.secure_url;
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            // Delete old image from Cloudinary if present
            if (event.image) {
                const urlParts = event.image.split('/');
                const fileName = urlParts[urlParts.length - 1].split('.')[0];
                const publicId = `events/${fileName}`;
                await deleteImageFromCloudinary(publicId);
            }
        }

        // If name changed, regenerate slug
        if (name !== event.name) {
            slug = name.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-')
                .trim();
        }

        event.name = name;
        event.slug = slug;
        event.image = imageUrl;
        await event.save();

        res.status(200).json({ message: 'Event updated successfully', event });
    } catch (error) {
        console.error("Error updating event:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Event name or slug already exists.' });
        }
        res.status(400).json({ message: error.message || 'Error updating event' });
    }
};

// Helper to delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
            console.log(`Deleted image from Cloudinary: ${publicId}`);
        } catch (error) {
            console.error(`Failed to delete Cloudinary image ${publicId}:`, error);
        }
    }
};

// @desc    Delete an event by ID
// @route   DELETE /api/events/:id
// @access  Admin
export const deleteEvent = async (req, res) => {
    const { id } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const deletedEvent = await eventModel.findByIdAndDelete(id);

        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Delete image from Cloudinary if present
        if (deletedEvent.image) {
            // Extract public_id from the image URL if you store it, or store public_id in the DB for easier deletion
            // For now, try to extract from URL (assuming folder/name-timestamp)
            const urlParts = deletedEvent.image.split('/');
            const fileName = urlParts[urlParts.length - 1].split('.')[0];
            const publicId = `events/${fileName}`;
            await deleteImageFromCloudinary(publicId);
        }

        res.status(200).json({ message: 'Event deleted successfully', event: deletedEvent });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: error.message || 'Error deleting event' });
    }
};
