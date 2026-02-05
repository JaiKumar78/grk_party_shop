// controller/user.js
import userModel from "../models/userModel.js";
import OTPModel from "../models/otpModel.js"; // Import the new OTP model
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import { createOrFindUserFromOrderData, getUserDataByEmail as getUserDataService } from '../services/userService.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or 'outlook', etc. or provide host/port directly
  auth: {
    user: process.env.EMAIL_USER, // Your email address (e.g., your_email@gmail.com)
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

// Helper functions (only isEmail is truly relevant for your current flow)
const isEmail = (contact) => validator.isEmail(contact);
// const isPhone = (contact) => validator.isMobilePhone(contact, 'any'); // No longer needed if only email OTP

const createToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, phone: user.phone }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Rate limiting constants
const OTP_COOLDOWN_SECONDS = 60; // Wait time before another OTP can be sent
const MAX_OTP_HOURLY_ATTEMPTS = 5; // Max OTP requests per hour
const OTP_HOURLY_WINDOW_SECONDS = 60 * 60; // 1 hour in seconds

// --- OTP Generation and Sending ---
export const sendOtp = async (req, res) => {
  // --- CHANGE IS HERE: Expect 'email' from req.body ---
  const { email } = req.body; 

  try {
    if (!email || !isEmail(email)) { // Directly validate the 'email'
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    let user = await userModel.findOne({ email: email.toLowerCase() });
    
    // Initialize user if not found (for new registrations/first OTP request)
    if (!user) {
        user = new userModel({
            name: 'Guest User', // Placeholder name, will be updated on verify
            email: email.toLowerCase(), // Set the email for the new user
            cart: [], // Ensure cart is initialized as an empty array
            // Set initial values for OTP rate limiting fields
            otpAttemptCount: 0,
            otpAttemptWindowStart: new Date(),
            // Password is not needed for OTP-only system, but if schema requires, use placeholder
            // password: 'TEMP_PASSWORD_FOR_OTP_FLOW_123!@#' 
        });
        await user.save();
    }

    // Basic rate limiting (cooldown period for sending subsequent OTPs)
    if (user.lastOtpSentAt) {
      const timeElapsedSinceLastOtp = (Date.now() - user.lastOtpSentAt.getTime()) / 1000; // in seconds
      if (timeElapsedSinceLastOtp < OTP_COOLDOWN_SECONDS) {
        return res.status(429).json({ message: `Please wait ${Math.ceil(OTP_COOLDOWN_SECONDS - timeElapsedSinceLastOtp)} seconds before requesting another OTP.` });
      }
    }

    // Hourly rate limiting check
    let currentOtpAttemptCount = user.otpAttemptCount || 0;
    let otpAttemptWindowStartTime = user.otpAttemptWindowStart || new Date(); 

    const timeElapsedSinceWindowStart = (Date.now() - otpAttemptWindowStartTime.getTime()) / 1000; // in seconds

    if (timeElapsedSinceWindowStart >= OTP_HOURLY_WINDOW_SECONDS) {
      currentOtpAttemptCount = 0;
      otpAttemptWindowStartTime = new Date();
    } else if (currentOtpAttemptCount >= MAX_OTP_HOURLY_ATTEMPTS) {
      const timeLeft = Math.ceil(OTP_HOURLY_WINDOW_SECONDS - timeElapsedSinceWindowStart);
      return res.status(429).json({ message: `You have requested too many OTPs. Please try again in ${Math.ceil(timeLeft / 60)} minutes.` });
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,       // Use digits (0-9)   
      lowerCaseAlphabets: false, // DO NOT use alphabets
      upperCaseAlphabets: false,   // (Irrelevant if alphabets is false)
      specialChars: false, // DO NOT use special characters
    });
    // console.log(otp);

    // Hash OTP before saving
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Invalidate any previous OTPs for this email
    await OTPModel.deleteMany({ contact: email, type: 'email' }); // Use 'email' for contact and type

    // Store new OTP
    await OTPModel.create({ contact: email, otp: hashedOtp, type: 'email' }); // Use 'email' for contact and type

    // Update user's OTP rate limiting fields and last OTP sent time
    user.lastOtpSentAt = new Date();
    user.otpAttemptCount = currentOtpAttemptCount + 1; 
    user.otpAttemptWindowStart = otpAttemptWindowStartTime; 
    await user.save();

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email, // Send to the 'email' received from req.body
      subject: 'Your OTP for E-commerce Login/Signup',
      html: `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p><p>This OTP is valid for 5 minutes.</p>`,
    });

    res.status(200).json({ message: 'OTP sent successfully! Please check your email.' });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again later.', error: error.message });
  }
};

// --- OTP Verification and Login/Signup ---
export const verifyOtp = async (req, res) => {
  const { email, otp, name } = req.body; // Expect 'email' and 'name'

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Find the OTP record
    const otpRecord = await OTPModel.findOne({ contact: email, type: 'email' }); // Query by email and type
    // console.log("otpRecord", otpRecord.otp);

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP. Please request a new one." });
    }

    // Compare provided OTP with the hashed OTP from the database
    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // OTP is valid and verified, delete it to prevent reuse
    await OTPModel.deleteOne({ _id: otpRecord._id });

    let user = await userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      // If user does not exist, this is a signup via OTP
      if (!name) {
        return res.status(400).json({ message: "Name is required for new user signup." });
      }
      user = new userModel({
        name: name,
        email: email.toLowerCase(),
        isVerified: true, // Set verified only after OTP
        // password: 'TEMP_PASSWORD_FOR_OTP_FLOW_123!@#' // A placeholder if schema requires a password field
      });
      await user.save();
      // console.log('New user created via OTP:', user);
    } else {
      // If user exists, it's a login
      if (!user.isVerified) {
        user.isVerified = true; // Set verified only after OTP
        await user.save();
      }
      // console.log('Existing user logged in via OTP:', user);
    }

    // Generate JWT token for the session
    const token = createToken(user);
    const { password: _, ...safeUser } = user._doc; 

    res.status(200).json({
      message: 'OTP verified successfully!',
      token,
      user: { ...safeUser, role: 'user' } 
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'OTP verification failed. Please try again.', error: error.message });
  }
};


// The following remain unchanged
export const editUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const updatedUser = await userModel.findByIdAndUpdate(userId, req.body, { new: true }).select('-password'); 
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated', user: updatedUser });
  } catch (error) {
    res.status(400).json({ message: 'Error updating User', error: error.message });
  }
}

export const removeUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const removedUser = await userModel.findByIdAndDelete(userId).select('-password'); 
    if (!removedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User removed', user: removedUser });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting User', error: error.message });
  }
}

export const getUsers = async (req, res) => {
  try {
    const users = await userModel.find().select('-password'); 
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
}

// @desc    Create or find user from guest order data
// @route   POST /api/user/create-from-order
// @access  Private (Internal use)
export const createOrFindUserFromOrder = async (req, res) => {
  try {
    const { customerDetails, shippingAddress } = req.body;
    
    if (!customerDetails || !customerDetails.email) {
      return res.status(400).json({ message: 'Customer details with email are required' });
    }

    const user = await createOrFindUserFromOrderData(customerDetails, shippingAddress);
    
    res.status(200).json({ 
      success: true, 
      user: user,
      message: 'User created/found successfully'
    });
  } catch (error) {
    console.error('Error creating/finding user from order:', error);
    res.status(500).json({ message: 'Error creating/finding user from order', error: error.message });
  }
};

// @desc    Get user data by email for form pre-filling
// @route   GET /api/user/data/:email
// @access  Public (for form pre-filling)
export const getUserDataByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const userData = await getUserDataService(email);

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user data by email:', error);
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
};

// @desc    Get user data by mobile number for form pre-filling
// @route   GET /api/user/data/phone/:mobileNo
// @access  Public (for form pre-filling)
export const getUserDataByPhone = async (req, res) => {
  try {
    const { mobileNo } = req.params;

    if (!mobileNo) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    // Find user by phone
    const user = await userModel.findOne({ phone: mobileNo }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Normalize to checkout form expectations
    const [firstName, ...rest] = (user.name || '').split(' ');
    const lastName = rest.join(' ');

    const normalized = {
      firstName: firstName || '',
      lastName: lastName || '',
      mobileNo: user.phone || '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        postalCode: user.address?.postalCode || '',
      },
      email: user.email || '',
    };

    res.status(200).json(normalized);
  } catch (error) {
    console.error('Error fetching user data by phone:', error);
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
};