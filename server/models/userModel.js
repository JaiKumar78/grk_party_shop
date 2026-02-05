// models/userModel.js
import mongoose from 'mongoose';
// Assuming you have bcryptjs for password hashing if not already included
// import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true }
  },
  // NEW FIELDS for OTP rate limiting
  otpAttemptCount: {
    type: Number,
    default: 0 // Number of OTP requests made within the current window
  },
  otpAttemptWindowStart: {
    type: Date,
    default: Date.now // Timestamp when the current OTP attempt window started
  },
  lastOtpSentAt: { // Existing field for cooldown, ensures a pause between individual OTPs
    type: Date,
    default: null
  },
  isVerified: { // Keep track of user verification status
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // CORRECTED: Cart should be an array of objects with product ID and quantity
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
      },
      variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      variantSku: {
        type: String,
        required: false,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
      },
      price: {
        type: Number,
        required: false,
      },
      image: {
        type: String,
        required: false,
      },
      variantAttributes: {
        type: Object,
        required: false,
      },
    },
  ],
  // Orders for logged-in users (remains the same)
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Orders', // References the 'Orders' model (your orderModel)
    }
  ],
});

// Optional: Add pre-save hook for password hashing if you haven't already
/*
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
*/

const User = mongoose.models.Users || mongoose.model('Users', userSchema);

export default User;
