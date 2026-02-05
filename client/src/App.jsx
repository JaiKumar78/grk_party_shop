import React, { useEffect, useRef, useState } from 'react'; // Added useState for local cart state
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { setCart, generateCartKey } from './store/slices/cartSlice';
import { useGetUserCartQuery, useUpdateUserCartMutation } from './store/api/cartApi';
import { AnimatePresence } from "framer-motion";
import { toast } from 'react-toastify';
import { loadCartState, saveCartState } from './utils/cartPersistence'; // Import persistence utils

// Import your page and component groups
import components from "./components/components";
import pages from "./pages/pages";

// Import layouts
import ConsumerLayout from "./layouts/ConsumerLayout";
import AdminLayout from "./layouts/AdminLayout";

// Import ScrollToTop
import ScrollToTop from './ScrollToTop';

const App = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.userAuth);
  // reduxCart represents the current Redux cart state
  const reduxCart = useSelector((state) => state.cart);

  // useRef to store the guest cart state before login.
  // This value will persist across renders without causing re-renders.
  const persistedGuestCartRef = useRef(null);

  // RTK Query hooks for server cart
  const { data: serverCart, isFetching: isFetchingServerCart, isSuccess: isServerCartSuccess, isError: isServerCartError, error: serverCartError } = useGetUserCartQuery(undefined, {
    skip: !isAuthenticated,
    keepPreviousData: false, // Always get fresh data when query is active
  });
  const [updateServerCart] = useUpdateUserCartMutation();

  // State to track if the initial cart from DB has been loaded into Redux for the current authenticated session.
  const [initialDbCartLoaded, setInitialDbCartLoaded] = useState(false);

  // Debounce ref for syncing cart changes to the backend or local storage
  const updateCartDebounced = useRef(null);



  // --- Effect 1: Manage initial cart state based on authentication status ---
  useEffect(() => {
    console.groupCollapsed('--- App useEffect (Auth/Initial Load) Triggered ---');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('isServerCartSuccess:', isServerCartSuccess);
    console.log('isFetchingServerCart:', isFetchingServerCart);
    console.log('serverCart (RTK Query data):', serverCart);
    console.log('initialDbCartLoaded flag:', initialDbCartLoaded);
    // console.log('reduxCart (current Redux state):', JSON.parse(JSON.stringify(reduxCart))); // Removed from log as it's a dependency of this effect
    console.log('persistedGuestCartRef.current (before logic):', JSON.parse(JSON.stringify(persistedGuestCartRef.current)));


    if (isAuthenticated) {
      console.log('App: User is authenticated.');
      // Logic for authenticated users: Load cart from database
      if (isServerCartSuccess && serverCart !== undefined && !isFetchingServerCart && !initialDbCartLoaded) {
        console.log('App: Conditions met: Authenticated, server cart data available, not fetching, DB cart not yet loaded.');

        // 1. Capture current Redux cart (which is the guest cart at this point) if not already captured
        // This is crucial: save the local state BEFORE overwriting with DB data
        if (persistedGuestCartRef.current === null) {
          persistedGuestCartRef.current = JSON.parse(JSON.stringify(reduxCart)); // Deep clone to avoid mutations
          console.log('App: Captured current Redux cart (guest cart) to ref:', JSON.parse(JSON.stringify(persistedGuestCartRef.current)));
        }

        // 2. Set Redux cart from database data
        // Normalize and merge duplicate items
        const normalizedItems = [];
        const itemMap = new Map(); // Use Map to track items by key
        
        serverCart.forEach(item => {
          // Generate the same key as the cart slice
          const productId = item.product;
          const variantId = item.variantId || null;
          // FIXED: Use consistent key generation - always use parent product ID + variant ID
          const key = generateCartKey(productId, variantId);
          
          if (itemMap.has(key)) {
            // Merge with existing item
            const existingItem = itemMap.get(key);
            existingItem.quantity += item.quantity;
          } else {
            // Create new normalized item
            const normalizedItem = {
              product: {
                _id: item.product,
                name: item.name,
                price: item.price,
                images: item.image ? [{ url: item.image }] : [],
                attributes: item.variantAttributes || {},
                variantId: item.variantId,
                variantSku: item.variantSku,
                stock: item.stock, // Use the current stock from backend
              },
              quantity: item.quantity,
            };
            itemMap.set(key, normalizedItem);
            normalizedItems.push(normalizedItem);
          }
        });
        
        const newTotalQuantity = normalizedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const newTotalAmount = normalizedItems.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 0)), 0);

        dispatch(setCart({
          items: normalizedItems,
          totalQuantity: newTotalQuantity,
          totalAmount: newTotalAmount,
        }));
        console.log('App: Redux cart set from DATABASE.');
        toast.info('Your cart has been loaded from your account!');
        setInitialDbCartLoaded(true); // Mark as loaded for current session
        console.log('App: initialDbCartLoaded set to TRUE.');

        // 3. IMPORTANT: DO NOT clear localStorageCart here. It holds the guest cart.
        // The Redux state is updated, but localStorage remains untouched by this login.

      } else if (isServerCartError && !isFetchingServerCart) {
        console.error('App: Error fetching server cart for authenticated user:', serverCartError);
        toast.error('Failed to load your cart from the server. Displaying empty cart.');
        // If DB fetch fails, ensure Redux cart is empty and persist that empty state to ref.
        dispatch(setCart({ items: [], totalQuantity: 0, totalAmount: 0 }));
        if (persistedGuestCartRef.current === null) {
          persistedGuestCartRef.current = { items: [], totalQuantity: 0, totalAmount: 0 };
        }
        setInitialDbCartLoaded(true); // Still mark as loaded to prevent infinite retries on error
      } else if (isAuthenticated && isFetchingServerCart) {
        console.log('App: Authenticated, but server cart is still fetching...');
      } else if (isAuthenticated && serverCart === undefined && !isFetchingServerCart) {
         console.log('App: Authenticated, serverCart data is undefined but not fetching, possibly initial state or no cart on DB. Waiting for RTK query to resolve.');
      }
    } else {
      // User is unauthenticated (or just logged out)
      console.log('App: User is unauthenticated.');
      // Logic for unauthenticated users: Load cart from local storage or previous guest state
      let cartToLoad;
      if (persistedGuestCartRef.current) {
        // If there's a stored guest cart (e.g., from pre-login), use that
        cartToLoad = persistedGuestCartRef.current;
        console.log('App: Restoring Redux cart from persistedGuestCartRef:', JSON.parse(JSON.stringify(cartToLoad)));
      } else {
        // Otherwise, load from local storage (e.g., on initial app load as guest)
        cartToLoad = loadCartState();
        console.log('App: Loading Redux cart from local storage (no persisted guest cart in ref):', JSON.parse(JSON.stringify(cartToLoad)));
      }
      dispatch(setCart(cartToLoad));
      setInitialDbCartLoaded(false); // Reset this flag for the next login
      console.log('App: initialDbCartLoaded set to FALSE (unauthenticated state).');
    }
    console.groupEnd();
  }, [isAuthenticated, isServerCartSuccess, serverCart, isFetchingServerCart, isServerCartError, serverCartError, dispatch, initialDbCartLoaded]); // Removed reduxCart dependencies

  // --- Effect 2: Synchronize Redux cart changes to appropriate storage ---
  useEffect(() => {
    console.groupCollapsed('--- App useEffect (Ongoing Cart Sync) Triggered ---');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('initialDbCartLoaded:', initialDbCartLoaded);
    console.log('reduxCart (current Redux state):', JSON.parse(JSON.stringify(reduxCart)));

    // Clear any previous debounce timeout
    if (updateCartDebounced.current) {
      clearTimeout(updateCartDebounced.current);
      console.log('App: Cleared previous debounce timeout.');
    }

    // Only sync if `reduxCart` is valid
    if (reduxCart === null || reduxCart === undefined) {
      console.warn('App: reduxCart is null or undefined, skipping sync.');
      console.groupEnd();
      return;
    }

    // Debounce the API call/LS save to prevent excessive updates on rapid changes
    updateCartDebounced.current = setTimeout(() => {
      if (isAuthenticated) {
        // If authenticated, sync the current Redux cart (which should hold DB data) to the server.
        // We ensure `initialDbCartLoaded` is true to only sync once the DB cart has been pulled.
        if (!initialDbCartLoaded) {
            console.log('App: Authenticated, but initialDbCartLoaded is false. Delaying sync to server.');
            console.groupEnd();
            return; // Skip sync until DB cart has been initially loaded
        }
        console.log('App: Authenticated. Syncing Redux cart changes to SERVER...');
        const cartItemsForServer = reduxCart.items.map(item => ({
          product: item.product._id,
          variantId: item.product.variantId || null,
          attributes: item.product.attributes || {},
          quantity: item.quantity,
        }));

        updateServerCart(cartItemsForServer)
          .unwrap()
          .then(() => {
            console.log('App: Authenticated cart changes synced to server successfully.');
          })
          .catch((error) => {
            console.error('App: Failed to sync authenticated cart changes to server:', error);
            toast.error('Failed to update cart on server.');
          });
      } else {
        // If unauthenticated, save the current Redux cart (which holds LS data) to local storage.
        console.log('App: Unauthenticated. Saving Redux cart changes to LOCAL STORAGE...');
        saveCartState(reduxCart); // Explicitly save the current Redux state to local storage
      }
      console.groupEnd(); // End of debounce block
    }, 500); // Debounce for 500ms

    // Cleanup function to clear timeout on component unmount or dependency change
    return () => {
      if (updateCartDebounced.current) {
        clearTimeout(updateCartDebounced.current);
        console.log('App: Cleanup: Cleared debounce timeout.');
      }
    };
  }, [reduxCart.items, reduxCart.totalQuantity, reduxCart.totalAmount, isAuthenticated, initialDbCartLoaded, updateServerCart]); // Dependencies for ongoing sync


  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* Consumer Routes */}
          <Route path="login" element={<pages.UserLoginPage />} />
          {/* <Route path="register" element={<pages.UserRegisterPage />} /> */}
          <Route path="/" element={<ConsumerLayout />}>
            <Route index element={<pages.HomePage />} />
            <Route path="products" element={<pages.ProductsPage />} />
            <Route path="categories" element={<pages.CategoriesPage />} />
            <Route path="about" element={<pages.AboutPage />} />
            <Route path="privacy" element={<pages.PrivacyPolicyPage />} />
            <Route path="terms" element={<pages.TermsOfServicePage />} />
            <Route path="shipping" element={<pages.ShippingPolicyPage />} />
            <Route path="returns" element={<pages.ReturnRefundPolicyPage />} />
            <Route path="collections/:slug" element={<pages.ProductDetailPage />} />
            <Route path="cart" element={<pages.CartPage />} />
            <Route path="checkout" element={<pages.CheckoutPage />} />
            {/* <Route path="order-confirmation/:id" element={<pages.OrderConfirmationPage />} /> */}
            <Route
              path="/profile"
              element={
                <components.UserProtectedRoute userOnly>
                  <pages.UserProfilePage />
                </components.UserProtectedRoute>
              }
            />
          {/* Consumer fallback for undefined routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<pages.AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <components.AdminProtectedRoute>
                <AdminLayout />
              </components.AdminProtectedRoute>
            }
          >
            <Route index element={<pages.AdminDashboardPage />} />
            <Route path="products" element={<pages.AdminProductsPage />} />
            <Route path="products/new" element={<pages.AdminProductFormPage />} />
            {/* UPDATED: Changed :id to :slug for product editing */}
            <Route path="products/edit/:slug" element={<pages.AdminProductFormPage />} />
            <Route path="orders" element={<pages.AdminOrdersPage />} />

            {/* NEW ADMIN ROUTES FOR PRODUCT TYPES (CATEGORIES) */}
            <Route path="categories" element={<pages.AdminCategoriesPage />} />

            {/* NEW ADMIN ROUTES FOR EVENTS */}
            <Route path="events" element={<pages.AdminEventsPage />} />
            <Route path="stores" element={<pages.AdminStoresPage />} /> {/* NEW: Route for stores */}
            <Route path="settings" element={<pages.AdminSettingsPage />} />
            {/* Admin fallback for undefined routes under /admin */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
