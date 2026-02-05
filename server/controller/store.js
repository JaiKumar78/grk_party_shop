// controllers/storeController.js
import Store from '../models/storeModel.js';
import mongoose from 'mongoose';

// @desc    Create a new store
// @route   POST /api/stores
// @access  Admin
export const createStore = async (req, res) => {
    try {
        const { name, address, phone, email } = req.body;

        // Basic validation
        if (!name || !address || !address.street || !address.city || !address.state || !address.postalCode || !address.country || !phone || !email) {
            return res.status(400).json({ message: 'All required store fields (name, address, phone, email) must be provided.' });
        }

        const store = new Store({
            name,
            address: {
                street: address.street,
                apartment: address.apartment || null, // Optional
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
            },
            phone,
            email,
        });

        await store.save();
        res.status(201).json({ message: 'Store created successfully', store });

    } catch (error) {
        console.error("Error creating store:", error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({ message: 'Duplicate key error.' });
        }
        res.status(500).json({ message: error.message || 'Server Error: Could not create store' });
    }
};

// @desc    Get all stores
// @route   GET /api/stores
// @access  Public (or Admin, depending on your needs. Making public for pickup selection)
export const getAllStores = async (req, res) => {
    try {
        const stores = await Store.find().sort({ name: 1 });
        res.status(200).json(stores);
    } catch (error) {
        console.error("Error fetching stores:", error);
        res.status(500).json({ message: error.message || 'Server Error: Could not fetch stores' });
    }
};

// @desc    Get store by ID
// @route   GET /api/stores/:id
// @access  Public
export const getStoreById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid store ID.' });
    }

    try {
        const store = await Store.findById(id);
        if (!store) {
            return res.status(404).json({ message: 'Store not found.' });
        }
        res.status(200).json(store);
    } catch (error) {
        console.error("Error fetching store by ID:", error);
        res.status(500).json({ message: error.message || 'Server Error: Could not fetch store' });
    }
};

// @desc    Update a store by ID
// @route   PUT /api/stores/:id
// @access  Admin
export const updateStore = async (req, res) => {
    const { id } = req.params;
    const { name, address, phone, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid store ID.' });
    }

    try {
        const store = await Store.findById(id);
        if (!store) {
            return res.status(404).json({ message: 'Store not found.' });
        }

        // Update fields if provided
        if (name) store.name = name;
        if (address) {
            if (address.street) store.address.street = address.street;
            store.address.apartment = address.apartment || null; // Allow setting to null/undefined
            if (address.city) store.address.city = address.city;
            if (address.state) store.address.state = address.state;
            if (address.postalCode) store.address.postalCode = address.postalCode;
            if (address.country) store.address.country = address.country;
        }
        if (phone) store.phone = phone;
        if (email) store.email = email;

        const updatedStore = await store.save();
        res.status(200).json({ message: 'Store updated successfully', store: updatedStore });

    } catch (error) {
        console.error("Error updating store:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Duplicate key error.' });
        }
        res.status(500).json({ message: error.message || 'Server Error: Could not update store' });
    }
};

// @desc    Delete a store by ID
// @route   DELETE /api/stores/:id
// @access  Admin
export const deleteStore = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid store ID.' });
    }

    try {
        const deletedStore = await Store.findByIdAndDelete(id);
        if (!deletedStore) {
            return res.status(404).json({ message: 'Store not found.' });
        }
        res.status(200).json({ message: 'Store deleted successfully' });
    } catch (error) {
        console.error("Error deleting store:", error);
        res.status(500).json({ message: error.message || 'Server Error: Could not delete store' });
    }
};
