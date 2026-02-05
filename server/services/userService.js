// services/userService.js
import User from '../models/userModel.js';

// Service function to create or find user from guest order data
export const createOrFindUserFromOrderData = async (customerDetails, shippingAddress) => {
  try {
    // Check if user already exists with this email
    let user = await User.findOne({ email: customerDetails.email.toLowerCase() });
    
    if (!user) {
      // Create new user from order data
      user = new User({
        name: (customerDetails.fullName ||
          `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim()),
        email: customerDetails.email.toLowerCase(),
        phone: customerDetails.mobileNo || '',
        address: shippingAddress ? {
          street: shippingAddress.street || '',
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          postalCode: shippingAddress.postalCode || ''
        } : {},
        isVerified: false, // Mark as NOT verified for guest orders
        cart: [], // Initialize empty cart
        orders: [] // Initialize empty orders array
      });
      await user.save();
      console.log(`Created new user from guest order: ${user.email}`);
    } else {
      // Update existing user's information if it's more complete
      let updated = false;
      
      if (!user.name || user.name === 'Guest User') {
        user.name = (customerDetails.fullName ||
          `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim());
        updated = true;
      }
      
      if (customerDetails.mobileNo && !user.phone) {
        user.phone = customerDetails.mobileNo;
        updated = true;
      }
      
      if (shippingAddress && (!user.address || !user.address.street)) {
        user.address = {
          street: shippingAddress.street || '',
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          postalCode: shippingAddress.postalCode || ''
        };
        updated = true;
      }
      
      if (updated) {
        await user.save();
        console.log(`Updated existing user from guest order: ${user.email}`);
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error creating/finding user from order:', error);
    throw error;
  }
};

// Service function to get user data by email for form pre-filling
export const getUserDataByEmail = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
                           .select('name email phone address');

    if (!user) {
      return null;
    }

    // Format user data for form pre-filling
    return {
      fullName: user.name,
      email: user.email,
      mobileNo: user.phone || '',
      address: user.address || {}
    };
  } catch (error) {
    console.error('Error fetching user data by email:', error);
    throw error;
  }
}; 