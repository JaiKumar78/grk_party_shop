// models/otpModel.js
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  contact: {
    type: String,
    required: true,
    trim: true,
    index: true // Index for fast lookups by contact (email in this case)
  },
  otp: {
    type: String,
    required: true, // This will store the hashed OTP
    //select: false // Do not return OTP hash in queries by default
  },
  type: {
    type: String,
    enum: ['email'], // Only allow 'email' type now
    default: 'email', // Set default to email
    required: true
  },
  // Automatically delete OTP record after 5 minutes (300 seconds)
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // OTP expires in 5 minutes (300 seconds)
  }
});

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);

export default OTP;
