// models/storeModel.js
import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        street: { type: String, required: true, trim: true },
        apartment: { type: String, required: false, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    // REMOVED: location field
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Store = mongoose.models.Stores || mongoose.model('Stores', storeSchema);
export default Store;
