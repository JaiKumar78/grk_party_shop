// store/index.js or store/store.js
import { configureStore } from '@reduxjs/toolkit';
import userAuthReducer from './slices/userAuthSlice';
import adminAuthReducer from './slices/adminAuthSlice';
import uiReducer from './slices/uiSlice';
import cartReducer from './slices/cartSlice';
import { productsApi } from './api/productsApi';
import { eventsApi } from './api/eventsApi';
import { categoriesApi } from './api/categoriesApi';
import { cartApi } from './api/cartApi';
// import { reviewsApi } from './api/reviewsApi'; // Assuming reviewsApi is also integrated
import { storesApi } from './api/storesApi'; // NEW: Import the new storesApi
import { settingsApi } from './api/settingsApi';
import { setupListeners } from '@reduxjs/toolkit/query';
import { paymentApi } from './api/paymentApi'; // NEW: Import paymentApi
import { ordersApi } from './api/ordersApi'; // NEW: Import ordersApi
import { usersApi } from './api/usersApi';

export const store = configureStore({
  reducer: {
    userAuth: userAuthReducer,
    adminAuth: adminAuthReducer,
    ui: uiReducer,
    cart: cartReducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [eventsApi.reducerPath]: eventsApi.reducer,
    [cartApi.reducerPath]: cartApi.reducer,
    // [reviewsApi.reducerPath]: reviewsApi.reducer, // Assuming reviewsApi is also integrated
    [storesApi.reducerPath]: storesApi.reducer, // NEW: Add storesApi reducer path
    [settingsApi.reducerPath]: settingsApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer, // NEW: Add paymentApi reducer
    [ordersApi.reducerPath]: ordersApi.reducer, // NEW: Add ordersApi reducer
    [usersApi.reducerPath]: usersApi.reducer, // NEW: Add usersApi reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      productsApi.middleware,
      categoriesApi.middleware,
      eventsApi.middleware,
      cartApi.middleware,
      // reviewsApi.middleware, // Assuming reviewsApi is also integrated
      storesApi.middleware, // NEW: Add storesApi middleware
      settingsApi.middleware,
      paymentApi.middleware, // NEW: Add paymentApi middleware
      ordersApi.middleware, // NEW: Add ordersApi middleware
      usersApi.middleware, // NEW: Add usersApi middleware
    ])
});

setupListeners(store.dispatch);
