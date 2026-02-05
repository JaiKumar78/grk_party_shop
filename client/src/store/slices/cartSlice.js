import { createSlice } from '@reduxjs/toolkit';
import { loadCartState, saveCartState, clearLocalStorageCart } from '../../utils/cartPersistence';

// Helper function to generate consistent cart keys
const generateCartKey = (productId, variantId) => {
  return variantId ? `${productId}_${variantId}` : `${productId}`;
};

// Helper function to normalize product structure for key generation
const normalizeProductForKey = (product) => {
  let productId, variantId;
  
  if (product.variantId) {
    // This is a variant product
    if (product._id === product.variantId) {
      // New product from ProductDetailPage: _id is variant ID
      productId = product.parentProductId || product._id;
      variantId = product._id;
    } else {
      // Database product: _id is parent product ID
      productId = product._id;
      variantId = product.variantId;
    }
  } else {
    // Simple product
    productId = product._id;
    variantId = null;
  }
  
  return { productId, variantId };
};

const initialState = (() => {
  try {
    const loadedState = loadCartState();
    // Additional validation to ensure cart data is clean
    if (loadedState && Array.isArray(loadedState.items) && loadedState.items.length > 0) {
      // Validate each item has required fields
      const validItems = loadedState.items.filter(item => 
        item && 
        item.product && 
        item.product._id && 
        typeof item.quantity === 'number' && 
        item.quantity > 0
      );
      
      if (validItems.length !== loadedState.items.length) {
        console.warn("CartPersistence: Some cart items were invalid, filtering them out.");
        return {
          items: validItems,
          totalQuantity: validItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
          totalAmount: validItems.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 0)), 0),
        };
      }
    }
    return loadedState || {
      items: [],
      totalQuantity: 0,
      totalAmount: 0,
    };
  } catch (error) {
    console.error("CartPersistence: Error during cart initialization, using empty cart:", error);
    return {
      items: [],
      totalQuantity: 0,
      totalAmount: 0,
    };
  }
})();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Adds a product to the cart or increments its quantity if already exists
    addItem: (state, action) => {
      const { product: newProduct, quantity: newQuantity = 1 } = action.payload;
      if (!newProduct || !newProduct._id || typeof newProduct.price === 'undefined') {
        console.error("Attempted to add malformed product to cart (missing _id or price):", action.payload);
        return;
      }
      
      // Use helper function to normalize product structure
      const { productId, variantId } = normalizeProductForKey(newProduct);
      const key = generateCartKey(productId, variantId);
      
      console.log('Cart Debug - Adding product:', {
        newProduct: { _id: newProduct._id, variantId: newProduct.variantId, name: newProduct.name },
        normalized: { productId, variantId },
        generatedKey: key,
        currentCartItems: state.items.length
      });
      
      const existingItem = state.items.find(item => {
        // Use helper function to normalize existing items too
        const { productId: itemProductId, variantId: itemVariantId } = normalizeProductForKey(item.product);
        const itemKey = generateCartKey(itemProductId, itemVariantId);
        
        console.log('Cart Debug - Checking existing item:', {
          item: { _id: item.product._id, variantId: item.product.variantId, name: item.product.name },
          normalized: { itemProductId, itemVariantId },
          itemKey,
          matches: itemKey === key
        });
        
        return itemKey === key;
      });
      
      if (existingItem) {
        console.log('Cart Debug - Found existing item, incrementing quantity from', existingItem.quantity, 'to', existingItem.quantity + newQuantity);
        existingItem.quantity += newQuantity;
      } else {
        console.log('Cart Debug - No existing item found, adding new item');
        // Normalize the product structure before adding
        const normalizedProduct = {
          ...newProduct,
          _id: productId, // Always use parent product ID as _id
          variantId: variantId, // Set variant ID if it's a variant
        };
        state.items.push({ product: normalizedProduct, quantity: newQuantity });
      }
      state.totalQuantity += newQuantity;
      state.totalAmount += ((newProduct.price || 0) * newQuantity);
      saveCartState(state);
    },
    // Removes a product entirely from the cart
    removeItem: (state, action) => {
      const { productId, variantId } = typeof action.payload === 'object' ? action.payload : { productId: action.payload, variantId: null };
      const key = generateCartKey(productId, variantId);
      const itemToRemove = state.items.find(item => {
        // Use helper function to normalize existing items
        const { productId: itemProductId, variantId: itemVariantId } = normalizeProductForKey(item.product);
        const itemKey = generateCartKey(itemProductId, itemVariantId);
        return itemKey === key;
      });
      if (itemToRemove) {
        state.totalQuantity -= itemToRemove.quantity;
        state.totalAmount -= ((itemToRemove.product.price || 0) * itemToRemove.quantity);
        state.items = state.items.filter(item => {
          // Use helper function to normalize existing items
          const { productId: itemProductId, variantId: itemVariantId } = normalizeProductForKey(item.product);
          const itemKey = generateCartKey(itemProductId, itemVariantId);
          return itemKey !== key;
        });
        saveCartState(state);
      }
    },
    // Increments the quantity of a specific product
    incrementQuantity: (state, action) => {
      const { productId, variantId } = typeof action.payload === 'object' ? action.payload : { productId: action.payload, variantId: null };
      const key = generateCartKey(productId, variantId);
      const itemToUpdate = state.items.find(item => {
        // Use helper function to normalize existing items
        const { productId: itemProductId, variantId: itemVariantId } = normalizeProductForKey(item.product);
        const itemKey = generateCartKey(itemProductId, itemVariantId);
        return itemKey === key;
      });
      if (itemToUpdate) {
        if (itemToUpdate.product.stock && itemToUpdate.quantity >= itemToUpdate.product.stock) {
            console.warn(`Cannot increment beyond stock for product ${itemToUpdate.product.name}`);
            return;
        }
        itemToUpdate.quantity++;
        state.totalQuantity++;
        state.totalAmount += (itemToUpdate.product.price || 0);
        saveCartState(state);
      }
    },
    // Decrements the quantity of a specific product, removes if quantity becomes 0
    decrementQuantity: (state, action) => {
      const { productId, variantId } = typeof action.payload === 'object' ? action.payload : { productId: action.payload, variantId: null };
      const key = generateCartKey(productId, variantId);
      const itemToUpdate = state.items.find(item => {
        // Use helper function to normalize existing items
        const { productId: itemProductId, variantId: itemVariantId } = normalizeProductForKey(item.product);
        const itemKey = generateCartKey(itemProductId, itemVariantId);
        return itemKey === key;
      });
      if (itemToUpdate) {
        if (itemToUpdate.quantity > 1) {
          itemToUpdate.quantity--;
          state.totalQuantity--;
          state.totalAmount -= (itemToUpdate.product.price || 0);
        } else {
          state.totalQuantity -= itemToUpdate.quantity;
          state.totalAmount -= ((itemToUpdate.product.price || 0) * itemToUpdate.quantity);
          state.items = state.items.filter(item => {
            // Use helper function to normalize existing items
            const { productId: itemProductId, variantId: itemVariantId } = normalizeProductForKey(item.product);
            const itemKey = generateCartKey(itemProductId, itemVariantId);
            return itemKey !== key;
          });
        }
        saveCartState(state);
      }
    },
    // Clears all items from the cart
    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
      clearLocalStorageCart(); // Remove cart from local storage
    },
    // Action to explicitly initialize the cart from local storage (used on app load)
    initializeCart: (state) => {
      // This reducer will automatically load from local storage via initialState logic.
      // We can use it as a trigger if needed, but the initialState does the heavy lifting.
    },
    // NEW: Action to explicitly set the entire cart state
    setCart: (state, action) => {
      const { items, totalQuantity, totalAmount } = action.payload;
      state.items = items;
      state.totalQuantity = totalQuantity;
      state.totalAmount = totalAmount;
      saveCartState(state);
    },
  },
});

export const {
  addItem,
  removeItem,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  initializeCart,
  setCart,
} = cartSlice.actions;

// Export helper functions for use in other components
export { generateCartKey, normalizeProductForKey };

export default cartSlice.reducer;
