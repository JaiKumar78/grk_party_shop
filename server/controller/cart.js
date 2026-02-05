// controllers/cartController.js
import User from '../models/userModel.js'; // Import your User model
import Product from '../models/productModel.js'; // Import your Product model to validate product IDs
import mongoose from 'mongoose';

// Helper function to generate consistent cart keys (matches frontend logic)
const generateCartKey = (productId, variantId) => {
  return variantId ? `${productId}_${variantId}` : `${productId}`;
};

// @desc    Get logged-in user's cart
// @route   GET /api/cart
// @access  Private (User)
export const getUserCart = async (req, res) => {
  try {
    // req.user is populated by your authentication middleware
    const user = await User.findById(req.user._id).select('cart');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch current stock information for each cart item
    const cartWithCurrentStock = await Promise.all(
      user.cart.map(async (item) => {
        try {
          // Find the product to get current stock
          const product = await Product.findById(item.product);
          if (!product) {
            // Product not found, return item with stock 0
            return { ...item.toObject(), stock: 0 };
          }

          if (item.variantId) {
            // For variant products, get the specific variant's stock
            const variant = product.variants?.find(v => v._id.toString() === item.variantId.toString());
            return {
              ...item.toObject(),
              stock: variant ? variant.stock : 0
            };
          } else {
            // For simple products, get the product's stock
            return {
              ...item.toObject(),
              stock: product.stock || 0
            };
          }
        } catch (error) {
          console.error('Error fetching stock for cart item:', error);
          return { ...item.toObject(), stock: 0 };
        }
      })
    );

    res.status(200).json(cartWithCurrentStock);
  } catch (error) {
    console.error('Error fetching user cart:', error);
    res.status(500).json({ message: error.message || 'Server Error: Could not fetch cart' });
  }
};

// @desc    Update logged-in user's cart (full replacement/sync from client)
// @route   PUT /api/cart
// @access  Private (User)
export const updateCart = async (req, res) => {
  // `newCartItems` is expected to be an array of { product: product._id, quantity: number }
  const { cartItems: newCartItems } = req.body;

  if (!Array.isArray(newCartItems)) {
    return res.status(400).json({ message: 'Cart items must be an array.' });
  }

  try {
    // Validate each item in the new cart and ensure product exists
    const validCartItems = [];
    for (const item of newCartItems) {
      // Try to find as a simple product first
      let productDoc = await Product.findById(item.product);
      let variant = null;
      let isVariant = false;
      if (!productDoc) {
        // Try to find as a variant
        productDoc = await Product.findOne({ 'variants._id': item.product });
        if (!productDoc) {
          console.warn('Product not found for cart item:', item.product);
          continue;
        }
        variant = productDoc.variants.find(v => v._id.toString() === item.product);
        if (!variant) {
          console.warn('Product variant not found:', item.product);
          continue;
        }
        isVariant = true;
      } else if (item.variantId) {
        variant = productDoc.variants?.find(v => v._id.toString() === item.variantId.toString());
        if (variant) isVariant = true;
      }
      if (isVariant && variant) {
        validCartItems.push({
          product: productDoc._id,
          variantId: variant._id,
          name: productDoc.name,
          variantSku: variant.sku,
          quantity: item.quantity,
          price: variant.price,
          image: variant.images[0]?.url || '',
          variantAttributes: variant.attributes || {},
        });
      } else {
        // Simple product
        validCartItems.push({
          product: productDoc._id,
          name: productDoc.name,
          quantity: item.quantity,
          price: productDoc.price,
          image: productDoc.images[0]?.url || '',
          variantAttributes: {},
        });
      }
    }

    // Use findByIdAndUpdate to atomically update the cart array, avoiding VersionError
    // Merge duplicate items (same product + variantId)
    const mergedCartItems = [];
    const itemMap = new Map();
    for (const item of validCartItems) {
      // Use helper function for consistent key generation
      const key = generateCartKey(item.product, item.variantId);
      if (itemMap.has(key)) {
        itemMap.get(key).quantity += item.quantity;
      } else {
        itemMap.set(key, { ...item });
        mergedCartItems.push(itemMap.get(key));
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { cart: mergedCartItems } }, // Use mergedCartItems instead of validCartItems
      { new: true, runValidators: true, select: 'cart' }
    ).populate('cart.product', 'name price images stock');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Cart updated successfully', cart: updatedUser.cart });
  } catch (error) {
    console.error('Error updating user cart:', error);
    res.status(500).json({ message: error.message || 'Server Error: Could not update cart' });
  }
};

// @desc    Clear logged-in user's cart
// @route   DELETE /api/cart
// @access  Private (User)
export const clearUserCart = async (req, res) => {
  try {
    // Use findByIdAndUpdate to atomically clear the cart array
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { cart: [] } }, // Set cart to an empty array
      { new: true, select: 'cart' } // Return updated user, select only cart
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing user cart:', error);
    res.status(500).json({ message: error.message || 'Server Error: Could not clear cart' });
  }
};
