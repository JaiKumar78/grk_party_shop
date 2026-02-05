// config/razorpayConfig.js
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Ensure your Razorpay API keys are set in your environment variables
// Example in .env:
// RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
// RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('ERROR: Razorpay API keys are not set in environment variables.');
    console.error('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.');
    // Exit the process or handle gracefully based on your application's needs
    // For development, you might just warn; for production, you might crash.
    // process.exit(1);
}

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default instance;
