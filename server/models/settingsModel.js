import mongoose from 'mongoose';

const shippingSchema = new mongoose.Schema({
  city: { type: String, required: true }, // e.g., 'Chennai', 'Other'
  normal: { type: Number, required: true }, // Normal shipping price
  quick: { type: Number }, // Quick delivery price (optional)
});

const settingsSchema = new mongoose.Schema({
  taxEnabled: { type: Boolean, default: true },
  taxPercentage: { type: Number, default: 5 }, // Default 5%
  shipping: [shippingSchema], // Array of shipping rules
}, { timestamps: true });

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

export default Settings; 