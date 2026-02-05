// models/orderModel.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products', // Reference to your Product model
        required: true,
    },
    variantId: { // For variant products, store the specific variant ID
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    name: {
        type: String,
        required: true,
    },
    variantSku: { // For variant products, store the SKU for reference
        type: String,
        required: false,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: { // Price at the time of order
        type: Number,
        required: true,
    },
    image: { // A single image URL for display in order history
        type: String,
        required: true,
    },
    variantAttributes: {
        type: Object,
        required: false,
    },
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', // Reference to your User model
        required: false, // Allow guest orders
    },
    // Customer details directly on the order schema for easier access and consistency
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    customerEmail: { // Email for order notifications
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    mobileNo: { // Optional mobile number
        type: String,
        required: false,
        trim: true,
    },

    oid: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    orderItems: [orderItemSchema],

    // Shipping Address fields, mostly required if deliveryMethod is 'Courier'
    shippingAddress: {
        street: { type: String, required: false, trim: true }, // Conditionally required by controller
        apartment: { type: String, required: false, trim: true }, // Optional
        city: { type: String, required: false, trim: true }, // Conditionally required by controller
        state: { type: String, required: false, trim: true }, // Conditionally required by controller
        postalCode: { type: String, required: false, trim: true }, // Conditionally required by controller
        country: { type: String, required: false, trim: true }, // Conditionally required by controller
    },

    deliveryMethod: {
        type: String,
        required: true,
        enum: ['Courier', 'Store Pickup'],
        default: 'Courier',
    },
    // NEW FIELD: Reference to the selected store if deliveryMethod is 'Store Pickup'
    pickupStore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stores', // Reference to a new Store model
        required: false, // Conditionally required by controller if deliveryMethod is 'Store Pickup'
    },

    deliverySpeed: {
        type: String,
        enum: ['quick', 'normal'],
        required: false,
    },

    razorpayOrderId: {
        type: String,
        required: true,
        unique: true,
    },
    razorpayPaymentId: {
        type: String,
        unique: true,
        sparse: true,
    },
    razorpaySignature: {
        type: String,
        sparse: true,
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false,
    },
    paidAt: {
        type: Date,
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['Processing', 'Shipped', 'Delivered'],
        default: 'Processing',
    },
    orderNotes: {
        type: String,
        required: false,
        trim: true,
    },
    paymentMethod: {
        type: String,
        required: false,
        trim: true,
    },
}, { timestamps: true });

const Order = mongoose.models.Orders || mongoose.model('Orders', orderSchema);
export default Order;
