// src/utils/cartPersistence.js

/**
 * Loads the cart state from local storage.
 * Provides a default empty cart if no valid state is found.
 * @returns {object} The parsed cart state or a default empty cart.
 */
export const loadCartState = () => {
  try {
    const serializedState = localStorage.getItem('cart');
    // If no cart state in local storage, or if it's an 'undefined' or 'null' string
    if (serializedState === null || serializedState === 'undefined' || serializedState === 'null') {
      console.log("CartPersistence: No valid cart state found in local storage. Returning empty default.");
      return { items: [], totalQuantity: 0, totalAmount: 0 };
    }
    const parsedState = JSON.parse(serializedState);

    // Robust validation for the structure of the parsed state
    if (typeof parsedState !== 'object' || parsedState === null || !Array.isArray(parsedState.items)) {
        console.warn("CartPersistence: Invalid cart state structure loaded from local storage. Resetting cart to default.", parsedState);
        return { items: [], totalQuantity: 0, totalAmount: 0 };
    }

    // Filter out any malformed items within the 'items' array that don't have a product object or _id
    parsedState.items = parsedState.items.filter(item => item && typeof item === 'object' && item.product && item.product._id);

    // Recalculate totals to ensure consistency after filtering malformed items
    // Use optional chaining for quantity and price in case an item or its product property is malformed
    parsedState.totalQuantity = parsedState.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    parsedState.totalAmount = parsedState.items.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 0)), 0);

    console.log("CartPersistence: Successfully loaded cart state from local storage.");
    return parsedState;
  } catch (e) {
    console.warn("CartPersistence: Could not load cart state from local storage (parsing error). Resetting cart to default.", e);
    return { items: [], totalQuantity: 0, totalAmount: 0 }; // Always return a valid object on error
  }
};

/**
 * Saves the current cart state to local storage.
 * @param {object} state - The cart state object to save.
 */
export const saveCartState = (state) => {
  try {
    const stateToSave = JSON.parse(JSON.stringify(state)); // Deep clone to avoid Immer proxy issues
    const serializedState = JSON.stringify(stateToSave);
    console.log("CartPersistence: Saving cart state to local storage.");
    localStorage.setItem('cart', serializedState);
  } catch (e) {
    console.warn("CartPersistence: Could not save cart state to local storage", e);
  }
};

/**
 * Clears the cart state from local storage.
 */
export const clearLocalStorageCart = () => {
  try {
    localStorage.removeItem('cart');
    console.log("CartPersistence: Local storage cart cleared.");
  } catch (e) {
    console.warn("CartPersistence: Could not clear local storage cart", e);
  }
};
