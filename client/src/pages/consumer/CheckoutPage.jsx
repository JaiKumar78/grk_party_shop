import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector as useReduxSelector } from 'react-redux';
import { useSelector, useDispatch } from 'react-redux';
// import { useAppDispatch } from '../hooks/reduxhooks';
import { clearCart } from '../../store/slices/cartSlice';
import { useGetAllStoresQuery } from '../../store/api/storesApi';
import { CreditCard, Lock, ArrowLeft, Check, AlertCircle, MapPin, Package, FastForward, Truck, Copy, CheckCircle, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  useProcessPaymentMutation,
} from '../../store/api/paymentApi';
import {
  useGetOrderByIdQuery,
  useGetUserDataByEmailQuery,
  useGetUserDataByPhoneQuery,
} from '../../store/api/ordersApi';
import { useGetSettingsQuery } from '../../store/api/settingsApi';

// Define shipping constants
const MIN_ORDER_VALUE = 200;

// >>> IMPORTANT: Replace with your actual Razorpay Key ID <<<
// In a real application, this should ideally be fetched from a backend endpoint
// or securely managed through environment variables during build time.
const RAZORPAY_KEY_ID = 'YOUR_RAZORPAY_KEY_ID_HERE';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items: cartItems, totalQuantity: totalItems, totalAmount: subtotal } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const [isProcessing, setIsProcessing] = useState(false);
  const { user: authUser } = useReduxSelector((state) => state.userAuth || {});
  const [orderComplete, setOrderComplete] = useState(false);
  const [errors, setErrors] = useState({});
  const [deliveryOption, setDeliveryOption] = useState('shipping'); // 'shipping' or 'pickup'
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [shippingMethod, setShippingMethod] = useState(''); // 'standardOutsideChennai', 'standardWithinChennai', 'free', 'sameDay'
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [acceptedShippingPolicy, setAcceptedShippingPolicy] = useState(false);
  const [acceptedReturnPolicy, setAcceptedReturnPolicy] = useState(false);

  // Initialize formData state for all input fields
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India', // Default country, can be made dynamic if needed
    specialInstructions: '',
  });
  
  // Track which fields have been manually modified by the user
  const [modifiedFields, setModifiedFields] = useState(new Set());

  // Fetch stores data
  const { data: stores, isLoading: isLoadingStores, isError: isErrorStores, error: storesError } = useGetAllStoresQuery();
  const { data: settings, isLoading: isSettingsLoading } = useGetSettingsQuery();

  // Fetch user data for form pre-filling
  const { data: userData, isLoading: isLoadingUserData } = useGetUserDataByEmailQuery(formData.email, {
    skip: !formData.email || formData.email.length < 3 || !/\S+@\S+\.\S+/.test(formData.email),
  });

  // Fetch user data by phone for pre-filling
  const normalizedPhone = formData.phone.replace(/\D/g, '').slice(-10);
  const { data: userDataByPhone, isLoading: isLoadingUserDataByPhone } = useGetUserDataByPhoneQuery(normalizedPhone, {
    skip: !normalizedPhone || normalizedPhone.length < 10,
  });

  // Copy order ID to clipboard
  const copyOrderId = async () => {
    if (confirmedOrder?.oid) {
      try {
        await navigator.clipboard.writeText(confirmedOrder.oid);
        setCopied(true);
        toast.success('Order ID copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Failed to copy order ID');
      }
    }
  };

  // Determine if shipping is within Chennai based on formData.city
  const isShippingWithinChennai = formData.city.trim().toLowerCase() === 'chennai';
  const [quickDelivery, setQuickDelivery] = useState(false);

  // Load Razorpay SDK only when needed for payment
  const loadRazorpaySDK = async () => {
    if (window.Razorpay) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay SDK'));
      };
      document.head.appendChild(script);
    });
  };

  // Initialize shipping method based on subtotal, delivery option, and city
  useEffect(() => {
    if (deliveryOption === 'shipping') {
      if (subtotal >= MIN_ORDER_VALUE) {
        // Default to normal delivery if no method chosen
        if (!shippingMethod) {
          setShippingMethod('normal');
        }
      } else {
        setShippingMethod(''); // No valid shipping method if below min order value
      }
    } else {
      setShippingMethod(''); // No shipping method if pickup
    }
  }, [subtotal, deliveryOption, shippingMethod]);

  // Set default selected store if stores load and there's a store available
  useEffect(() => {
    if (deliveryOption === 'pickup' && stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0]._id); // Automatically select the first store
    }
  }, [deliveryOption, stores, selectedStoreId]);

  // Close store dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isStoreDropdownOpen && !event.target.closest('.store-dropdown')) {
        setIsStoreDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStoreDropdownOpen]);

  // Pre-fill form when user data is fetched
  useEffect(() => {
    if (userData && !isLoadingUserData) {
      setFormData(prev => ({
        ...prev,
        // Only pre-fill fields that haven't been manually modified by the user
        fullName:
          !modifiedFields.has('fullName') && (userData.firstName || userData.lastName)
            ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
            : prev.fullName,
        phone: !modifiedFields.has('phone') && userData.mobileNo ? userData.mobileNo : prev.phone,
        address: !modifiedFields.has('address') && userData.address?.street ? userData.address.street : prev.address,
        city: !modifiedFields.has('city') && userData.address?.city ? userData.address.city : prev.city,
        state: !modifiedFields.has('state') && userData.address?.state ? userData.address.state : prev.state,
        zipCode: !modifiedFields.has('zipCode') && userData.address?.postalCode ? userData.address.postalCode : prev.zipCode,
      }));
      // Removed toast notification here
    }
  }, [userData, isLoadingUserData, modifiedFields]);

  // Pre-fill form when user data is fetched by phone
  useEffect(() => {
    if (userDataByPhone && !isLoadingUserDataByPhone) {
      setFormData(prev => ({
        ...prev,
        fullName:
          !modifiedFields.has('fullName') && (userDataByPhone.firstName || userDataByPhone.lastName)
            ? `${userDataByPhone.firstName || ''} ${userDataByPhone.lastName || ''}`.trim()
            : prev.fullName,
        email: !modifiedFields.has('email') && userDataByPhone.email ? userDataByPhone.email : prev.email,
        address: !modifiedFields.has('address') && userDataByPhone.address?.street ? userDataByPhone.address.street : prev.address,
        city: !modifiedFields.has('city') && userDataByPhone.address?.city ? userDataByPhone.address.city : prev.city,
        state: !modifiedFields.has('state') && userDataByPhone.address?.state ? userDataByPhone.address.state : prev.state,
        zipCode: !modifiedFields.has('zipCode') && userDataByPhone.address?.postalCode ? userDataByPhone.address.postalCode : prev.zipCode,
      }));
    }
  }, [userDataByPhone, isLoadingUserDataByPhone, modifiedFields]);

  // Auto-prefill if user is logged in
  useEffect(() => {
    if (authUser) {
      const name = authUser.name || '';
      const parts = name.split(' ');
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || name || parts.join(' '),
        phone: prev.phone || authUser.phone || '',
        email: prev.email || authUser.email || '',
        address: prev.address || authUser.address?.street || '',
        city: prev.city || authUser.address?.city || '',
        state: prev.state || authUser.address?.state || '',
        zipCode: prev.zipCode || authUser.address?.postalCode || '',
      }));
    }
  }, [authUser]);


  // Helper to get shipping rule for the entered city or fallback to 'Other'
  const getShippingRule = () => {
    if (!settings) return null;
    // If no city entered, show 'Other' by default
    if (!formData.city.trim()) {
      return settings.shipping.find(s => s.city.trim().toLowerCase() === 'other');
    }
    // If city matches, show that city's rule; else show 'Other'
    const cityRule = settings.shipping.find(
      s => s.city.trim().toLowerCase() === formData.city.trim().toLowerCase()
    );
    if (cityRule) {
      return cityRule;
    }
    // console.log(settings.shipping.find(s => s.city.trim().toLowerCase() === 'other'))
    return settings.shipping.find(s => s.city.trim().toLowerCase() === 'other');
  };

  // Calculate shipping and tax using backend settings
  const calculateShippingAndTax = () => {
    let shipping = 0;
    let tax = 0;
    let deliverySpeed = 'normal';
    
    // console.log('=== CALCULATION DEBUG ===');
    // console.log('Current shippingMethod:', shippingMethod);
    // console.log('Current deliveryOption:', deliveryOption);
    // console.log('Settings available:', !!settings);
    
    if (settings) {
      // Find shipping rule
      const shippingRule = getShippingRule();
      // console.log('Shipping rule found:', shippingRule);
      
      if (deliveryOption === 'pickup') {
        shipping = 0;
        deliverySpeed = 'pickup';
      } else if (shippingRule) {
        if (shippingMethod === 'quick' && typeof shippingRule.quick === 'number') {
          shipping = shippingRule.quick;
          deliverySpeed = 'quick';
        } else if (shippingMethod === 'normal' && typeof shippingRule.normal === 'number') {
          shipping = shippingRule.normal;
          deliverySpeed = 'normal';
        } else if (typeof shippingRule.normal === 'number') {
          // Fallback to normal if no method selected but normal is available
          shipping = shippingRule.normal;
          deliverySpeed = 'normal';
        }
      }
      // Tax
      if (settings.taxEnabled === true) {
        const rate = Number(settings.taxPercentage) || 0;
        tax = subtotal * rate / 100;
      }
    }
    
    return { shipping, tax, deliverySpeed };
    };

    // Calculate for display purposes
    const { shipping, tax } = calculateShippingAndTax();
    const total = subtotal + shipping + tax;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Mark this field as manually modified by the user
    setModifiedFields(prev => new Set([...prev, name]));
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };



  const handleDeliveryOptionChange = (option) => {
    setDeliveryOption(option);
    // Clear shipping method when switching from shipping
    if (option === 'pickup') {
      setShippingMethod('');
      setErrors(prev => {
        const newErrors = { ...prev };
        // Clear shipping-related errors when switching to pickup
        delete newErrors.fullName;
        delete newErrors.email;
        delete newErrors.phone;
        delete newErrors.address;
        delete newErrors.city;
        delete newErrors.state;
        delete newErrors.zipCode;
        delete newErrors.country;
        return newErrors;
      });
    } else if (option === 'shipping') {
      // Re-initialize shipping method based on subtotal when switching back to shipping
      if (subtotal >= MIN_ORDER_VALUE) {
        setShippingMethod('normal'); // Default to normal if above threshold
      } else {
        setShippingMethod(''); // Ensure no method if below min
      }
    }
  };

  // Determine if Same Day Delivery is available based on the city in formData
  const isSameDayDeliveryAvailable = formData.city.toLowerCase() === 'chennai';

  const validateForm = () => {
    const newErrors = {};
    if (subtotal < MIN_ORDER_VALUE) {
      newErrors.minimumOrder = `Minimum order value is ₹${MIN_ORDER_VALUE}. Your current subtotal is ₹${subtotal.toFixed(2)}.`;
    }
    // Shipping information required if deliveryOption is 'shipping'
    if (deliveryOption === 'shipping') {
      const shippingFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
      shippingFields.forEach(field => {
        if (!formData[field].trim()) {
          newErrors[field] = 'This field is required';
        }
      });
      if (subtotal >= MIN_ORDER_VALUE && !shippingMethod) {
        newErrors.shippingMethod = 'Please select a shipping method.';
      }
    } else if (deliveryOption === 'pickup' && !selectedStoreId) {
      newErrors.selectedStoreId = 'Please select a pickup store.';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [processPayment] = useProcessPaymentMutation();

  const startRazorpayPayment = async () => {
    setIsProcessing(true);
    setErrors({});
    try {
      // Load Razorpay SDK if not already loaded
      await loadRazorpaySDK();
      
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not loaded. Please ensure you are online and try again.');
      }
      
      // Calculate delivery speed at payment time with detailed logging
      const { deliverySpeed } = calculateShippingAndTax();
      

      
      // Split full name into first and last name for backend compatibility
      const nameParts = (formData.fullName || '').trim().split(' ').filter(Boolean);
      let firstName = '';
      let lastName = '';
      if (nameParts.length === 1) {
        // If only one word is provided, use it for both first and last name
        firstName = nameParts[0];
        lastName = nameParts[0];
      } else if (nameParts.length > 1) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }

      // Calculate the total (including shipping and tax)
      const payload = {
        amount: total, // total includes subtotal + shipping + tax
        currency: 'INR',
        cartItems: cartItems.map(item => ({
          product: item.product.variantId || item.product._id, // Send variant ID if it's a variant, otherwise product ID
          quantity: item.quantity,
          attributes: item.product.attributes || {},
        })),
        customerDetails: {
          firstName,
          lastName,
          fullName: formData.fullName,
          email: formData.email,
          mobileNo: formData.phone,
        },
        shippingAddress: {
          street: formData.address,
          apartment: '',
          city: formData.city,
          state: formData.state,
          postalCode: formData.zipCode,
          country: formData.country,
        },
        deliveryMethod: deliveryOption === 'pickup' ? 'Store Pickup' : 'Courier',
        pickupStore: deliveryOption === 'pickup' ? selectedStoreId : undefined,
        shippingPrice: shipping, // Add shipping price
        ...(settings?.taxEnabled ? { taxPrice: tax } : {}), // Only include tax if enabled
        ...(deliveryOption !== 'pickup' ? { deliverySpeed } : {}), // Only include deliverySpeed if not pickup
        ...(deliveryOption !== 'pickup' ? { quickDelivery: shippingMethod === 'quick' } : {}), // Only include quickDelivery if not pickup
      };
      

      
      // Use RTK Query mutation for order creation
      const orderDetails = await processPayment(payload).unwrap();
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderDetails.amount, // Use backend's amount (in paise)
        currency: orderDetails.currency,
        name: 'GRK Party Shop',
        description: 'Order Payment',
        // image: 'https://placehold.co/100x100/F0F0F0/888888?text=GRK',
        image: 'https://res.cloudinary.com/dhwkdr8h6/image/upload/v1751609281/Gemini_Generated_Image_uve83wuve83wuve8-removebg-preview_fs5emt.png',
        // image: 'https://res.cloudinary.com/dhwkdr8h6/image/upload/v1751609331/Gemini_Generated_Image_uve83wuve83wuve8_wuugsw.png',
        order_id: orderDetails.razorpayOrderId,
        handler: async function (response) {
          setIsProcessing(true);
          try {
            // Use RTK Query mutation for payment verification and order completion
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...orderDetails.orderData, // Include the processed order data from the first call
              ...(deliveryOption !== 'pickup' ? { quickDelivery: shippingMethod === 'quick' } : {}), // Only include quickDelivery if not pickup
            };
            

            
            const verifyRes = await processPayment(verifyPayload).unwrap();
            if (verifyRes.success) {
              toast.success('Payment successful! Your order has been placed.');
              setConfirmedOrderId(verifyRes.orderId); // Save orderId for fetching
              dispatch(clearCart());
              setOrderComplete(true);
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            toast.error(error.data?.message || error.message || 'An error occurred during payment verification.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          special_instructions: formData.specialInstructions,
        },
        theme: { color: '#EC4899' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description || 'Please try again.'}`);
        setIsProcessing(false);
      });
      rzp.on('modal.close', function () {
        // Reset processing state when user closes the payment popup
        setIsProcessing(false);
      });
      
      // Also handle other modal events that might occur when user exits
      rzp.on('payment.cancelled', function () {
        setIsProcessing(false);
      });
      
      rzp.on('payment.error', function (response) {
        setIsProcessing(false);
      });
      
      // Add a fallback timeout to reset processing state if no events fire
      const processingTimeout = setTimeout(() => {
        setIsProcessing(false);
      }, 30000); // 30 seconds timeout
      
      // Clear timeout when payment completes successfully
      const originalHandler = options.handler;
      options.handler = async function(response) {
        clearTimeout(processingTimeout);
        return originalHandler(response);
      };
      
      rzp.open();
    } catch (error) {
      toast.error(error.data?.message || error.message || 'Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };


  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please correct the errors in the form.');
      // Scroll to the first error if possible
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Add a small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Instead of direct order submission, now initiate Razorpay payment flow
    // The actual order finalization (clearing cart, setting orderComplete) happens
    // inside the Razorpay handler after successful and verified payment.
    startRazorpayPayment();
  };

  // Disable the place order button if processing, cart is empty, min order not met,
  // or mandatory policy checkboxes are not accepted
  const disablePlaceOrder =
    isProcessing ||
    totalItems === 0 ||
    subtotal < MIN_ORDER_VALUE ||
    !acceptedShippingPolicy ||
    !acceptedReturnPolicy;
  


  // Fetch confirmed order details after payment
  const { data: confirmedOrder, isLoading: isOrderLoading } = useGetOrderByIdQuery(confirmedOrderId, {
    skip: !confirmedOrderId,
  });


  if (totalItems === 0 && !orderComplete) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center py-16">
            <AlertCircle size={64} className="text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some items to your cart before checking out.</p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-medium transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    if (isOrderLoading || !confirmedOrder) {
      return (
        <div className="pt-24 pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 animate-spin border-4 border-pink-200 border-t-pink-600 rounded-full"></div>
            <p className="text-lg text-gray-700">Loading your order details...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Order Confirmed!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for your purchase! Your order has been successfully placed and you'll receive a confirmation email shortly.
            </p>
            
            {/* Order ID with Copy Button */}
            {confirmedOrder?.oid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Order ID</h3>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-lg font-bold text-blue-900 bg-white px-4 py-2 rounded border">
                    {confirmedOrder.oid}
                  </span>
                  <button
                    onClick={copyOrderId}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      copied
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  Save this order ID for tracking your order
                </p>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              {/* Detailed Order Items from confirmedOrder */}
              <div className="space-y-3 mb-6 text-left">
                {confirmedOrder.orderItems && confirmedOrder.orderItems.length > 0 ? (
                  confirmedOrder.orderItems.map((item) => (
                    <div key={item._id} className="flex items-center">
                      <img
                        src={item.image || `https://placehold.co/48x48/FEE2E2/EF4444?text=${(item.name || '?')[0]}`}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                        onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/48x48/FEE2E2/EF4444?text=${(item.name || '?')[0]}` }}
                      />
                      <div className="ml-3 flex-auto min-w-0 pr-2">
                        <h4 className="text-sm font-medium text-gray-800 truncate">
                          {item.name}
                        </h4>
                        {/* {item.variantSku && (
                          <div className="flex flex-wrap gap-2 my-1">
                            <span className="rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-semibold border border-purple-200">
                              {item.variantSku}
                            </span>
                          </div>
                        )} */}
                        {/* Show attributes if present */}
                        {item.variantAttributes && Object.values(item.variantAttributes).length > 0 && (
                          <div className="flex flex-wrap gap-2 my-1">
                            {Object.values(item.variantAttributes).map((value, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold border border-blue-200"
                              >
                                {value}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-800 w-24 text-right flex-shrink-0">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center">No items in this order.</p>
                )}
              </div>
              {/* Totals from confirmedOrder */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({confirmedOrder.orderItems?.reduce((sum, i) => sum + i.quantity, 0) || 0} items)</span>
                  <span>₹{confirmedOrder.itemsPrice?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  {confirmedOrder.shippingPrice === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>₹{confirmedOrder.shippingPrice?.toFixed(2) || '0.00'}</span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>₹{confirmedOrder.taxPrice?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{confirmedOrder.totalPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Package size={20} className="mr-2 text-blue-600" />
                Delivery Information
              </h3>
              
              {/* Store Pickup Information */}
              {confirmedOrder.deliveryMethod === 'Store Pickup' && confirmedOrder.pickupStore && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <MapPin size={20} className="text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">Store Pickup</h4>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-blue-800">{confirmedOrder.pickupStore.name}</p>
                        {confirmedOrder.pickupStore.address?.street && (
                          <p className="text-blue-700">{confirmedOrder.pickupStore.address.street}</p>
                        )}
                        <p className="text-blue-700">
                          {confirmedOrder.pickupStore.address?.city}, {confirmedOrder.pickupStore.address?.state}
                        </p>
                        {confirmedOrder.pickupStore.address?.postalCode && (
                          <p className="text-blue-700">{confirmedOrder.pickupStore.address.postalCode}</p>
                        )}
                        {confirmedOrder.pickupStore.phone && (
                          <p className="text-blue-700">📞 {confirmedOrder.pickupStore.phone}</p>
                        )}
                        {confirmedOrder.pickupStore.email && (
                          <p className="text-blue-700">✉️ {confirmedOrder.pickupStore.email}</p>
                        )}
                      </div>
                      <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                        <p className="text-xs text-blue-800 font-medium">
                          💡 Please bring your order ID and a valid ID proof when collecting your order.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Delivery Information */}
              {confirmedOrder.deliveryMethod === 'Courier' && confirmedOrder.deliverySpeed === 'quick' && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FastForward size={20} className="text-rose-600 mr-3 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-rose-900 mb-2">Quick Delivery</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-rose-800">
                          Your order will be delivered within <span className="font-semibold">same day</span>.
                        </p>
                        {confirmedOrder.shippingAddress && (
                          <div className="bg-rose-100 rounded p-3 border border-rose-300">
                            <p className="font-medium text-rose-900 mb-1">Delivery Address:</p>
                            <div className="text-rose-800">
                              <p>
                                {confirmedOrder.shippingAddress.fullName ||
                                  `${confirmedOrder.shippingAddress.firstName || ''} ${confirmedOrder.shippingAddress.lastName || ''}`.trim()}
                              </p>
                              {confirmedOrder.shippingAddress.apartment && (
                                <p>{confirmedOrder.shippingAddress.apartment}</p>
                              )}
                              <p>{confirmedOrder.shippingAddress.street}</p>
                              <p>
                                {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.state} {confirmedOrder.shippingAddress.postalCode}
                              </p>
                              <p>{confirmedOrder.shippingAddress.country}</p>
                            </div>
                          </div>
                        )}
                        <div className="mt-3 p-2 bg-rose-100 rounded border border-rose-300">
                          <p className="text-xs text-rose-800 font-medium">
                            ⚡ You'll receive SMS updates about your delivery status.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Normal Delivery Information */}
              {confirmedOrder.deliveryMethod === 'Courier' && confirmedOrder.deliverySpeed === 'normal' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Truck size={20} className="text-green-600 mr-3 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-2">Standard Delivery</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-green-800">
                          Your order will be delivered within <span className="font-semibold">2-3 working days</span>.
                        </p>
                        {confirmedOrder.shippingAddress && (
                          <div className="bg-green-100 rounded p-3 border border-green-300">
                            <p className="font-medium text-green-900 mb-1">Delivery Address:</p>
                            <div className="text-green-800">
                              <p>
                                {confirmedOrder.shippingAddress.fullName ||
                                  `${confirmedOrder.shippingAddress.firstName || ''} ${confirmedOrder.shippingAddress.lastName || ''}`.trim()}
                              </p>
                              {confirmedOrder.shippingAddress.apartment && (
                                <p>{confirmedOrder.shippingAddress.apartment}</p>
                              )}
                              <p>{confirmedOrder.shippingAddress.street}</p>
                              <p>
                                {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.state} {confirmedOrder.shippingAddress.postalCode}
                              </p>
                              <p>{confirmedOrder.shippingAddress.country}</p>
                            </div>
                          </div>
                        )}
                        <div className="mt-3 p-2 bg-green-100 rounded border border-green-300">
                          <p className="text-xs text-green-800 font-medium">
                            📦 You'll receive tracking updates via email and SMS.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-medium transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shippingRule = getShippingRule();

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/cart')}
              className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Cart
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
            <p className="text-gray-600">Complete your order below</p>
          </div>

          {/* Minimum Order Value Alert */}
          {subtotal < MIN_ORDER_VALUE && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Minimum Order Alert!</strong>
              <span className="block sm:inline ml-2">
                You need to have a minimum order value of ₹{MIN_ORDER_VALUE} to proceed. Your current subtotal is ₹{subtotal.toFixed(2)}.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Customer Information (Always show) */}
                <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Customer Information</h2>
                {(userData && !isLoadingUserData) || (userDataByPhone && !isLoadingUserDataByPhone) ? (
                    <p className="text-green-600 text-sm -mt-2 mb-4 flex items-center">
                      <CheckCircle size={14} className="mr-1" />
                      Previous order data found! Your information will be pre-filled.
                    </p>
                  ) : null}
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Ex: 9876543210"
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {isLoadingUserDataByPhone && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {isLoadingUserData && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                          errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Information (Conditional) */}
                {deliveryOption === 'shipping' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Shipping Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                            errors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.city && (
                          <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                            errors.state ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.state && (
                          <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                            errors.zipCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.zipCode && (
                          <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}


              </form>
              
              {/* Delivery Options - Moved below the form */}
              <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Delivery Options</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Shipping Option */}
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer flex-1 ${
                      deliveryOption === 'shipping' ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500' : 'border-gray-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="shipping"
                      checked={deliveryOption === 'shipping'}
                      onChange={() => handleDeliveryOptionChange('shipping')}
                      className="form-radio text-pink-600 h-5 w-5"
                    />
                    <div className="ml-3">
                      <div className="font-semibold text-gray-800 flex items-center">
                        <Package size={20} className="mr-2" />
                        Ship to Address
                      </div>
                      <p className="text-sm text-gray-600">Get your order delivered to your doorstep.</p>
                    </div>
                  </label>

                  {/* Pickup Option */}
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer flex-1 ${
                      deliveryOption === 'pickup' ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500' : 'border-gray-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="pickup"
                      checked={deliveryOption === 'pickup'}
                      onChange={() => handleDeliveryOptionChange('pickup')}
                      className="form-radio text-pink-600 h-5 w-5"
                    />
                    <div className="ml-3">
                      <div className="font-semibold text-gray-800 flex items-center">
                        <MapPin size={20} className="mr-2" />
                        Pickup at Store
                      </div>
                      <p className="text-sm text-gray-600">Collect your order from a local store.</p>
                    </div>
                  </label>
                </div>

                {/* Shipping Method Options (conditional) */}
                {deliveryOption === 'shipping' && subtotal >= MIN_ORDER_VALUE && !isSettingsLoading && (
                  <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Choose Shipping Method</h2>
                    {shippingRule && (typeof shippingRule.normal === 'number' || typeof shippingRule.quick === 'number') ? (
                      <div className="space-y-3">
                        {/* Normal Delivery Option */}
                        {typeof shippingRule.normal === 'number' && (
                          <label className={`flex items-start p-4 border rounded-lg cursor-pointer ${shippingMethod === 'normal' ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500' : 'border-gray-300 bg-white'}`}>
                            <input
                              type="radio"
                              name="shippingMethod"
                              value="normal"
                              checked={shippingMethod === 'normal'}
                              onChange={() => setShippingMethod('normal')}
                              className="form-radio text-pink-600 h-5 w-5 mt-1"
                            />
                            <div className="ml-3 flex-grow">
                              <div className="font-semibold text-gray-800 flex items-center">
                                <Truck size={20} className="mr-2" />
                                Normal Delivery
                              </div>
                              <p className="text-sm text-gray-600">Delivery in 2-3 working days. Reliable and affordable for your city.</p>
                            </div>
                            <span className="font-semibold text-gray-800">₹{shippingRule.normal}</span>
                          </label>
                        )}
                        {/* Quick Delivery Option (only if available) */}
                        {typeof shippingRule.quick === 'number' && (
                          <label className={`flex items-start p-4 border rounded-lg cursor-pointer ${shippingMethod === 'quick' ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500' : 'border-gray-300 bg-white'}`}>
                            <input
                              type="radio"
                              name="shippingMethod"
                              value="quick"
                              checked={shippingMethod === 'quick'}
                              onChange={() => setShippingMethod('quick')}
                              className="form-radio text-rose-600 h-5 w-5 mt-1"
                            />
                            <div className="ml-3 flex-grow">
                              <div className="font-semibold text-gray-800 flex items-center">
                                <FastForward size={20} className="mr-2" />
                                Quick Delivery
                              </div>
                              <p className="text-sm text-gray-600">Same day/express delivery for urgent needs. Available only in select cities.</p>
                            </div>
                            <span className="font-semibold text-gray-800">₹{shippingRule.quick}</span>
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-500 text-sm">No shipping options available for this city. Please check your address or contact support.</div>
                    )}
                  </div>
                )}

                {/* Store selection dropdown (conditional) */}
                {deliveryOption === 'pickup' && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Pickup Store *
                    </label>
                    {isLoadingStores ? (
                      <p className="text-gray-600">Loading stores...</p>
                    ) : isErrorStores ? (
                      <p className="text-red-500 text-sm">
                        Error loading stores: {storesError?.data?.message || 'Unknown error'}
                      </p>
                    ) : stores && stores.length > 0 ? (
                      <div className="relative store-dropdown">
                        <button
                          type="button"
                          onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                          className={`w-full px-4 py-3 border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 ${
                            errors.selectedStoreId 
                              ? 'border-red-500 bg-red-50' 
                              : isStoreDropdownOpen 
                                ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500' 
                                : 'border-gray-300 bg-white hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <MapPin size={20} className="text-gray-400 mr-3" />
                              <span className={selectedStoreId ? 'text-gray-900' : 'text-gray-500'}>
                                {selectedStoreId 
                                  ? stores.find(s => s._id === selectedStoreId)?.name 
                                  : 'Choose a pickup store'
                                }
                              </span>
                            </div>
                            <ChevronDown 
                              size={20} 
                              className={`text-gray-400 transition-transform duration-200 ${
                                isStoreDropdownOpen ? 'rotate-180' : ''
                              }`} 
                            />
                          </div>

                        </button>
                        
                        {isStoreDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {stores.map((store) => (
                              <button
                                key={store._id}
                                type="button"
                                onClick={() => {
                                  setSelectedStoreId(store._id);
                                  setIsStoreDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                                  selectedStoreId === store._id 
                                    ? 'bg-pink-50 border-l-4 border-pink-500' 
                                    : 'border-l-4 border-transparent'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <MapPin size={16} className="text-gray-400 mr-3" />
                                    <span className="font-medium text-gray-900">{store.name}</span>
                                  </div>
                                  {selectedStoreId === store._id && (
                                    <CheckCircle size={16} className="text-pink-500" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">No stores available for pickup.</p>
                    )}
                    {errors.selectedStoreId && (
                      <p className="text-red-500 text-sm mt-1">{errors.selectedStoreId}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-6">
                  {cartItems.length > 0 ? (
                    cartItems.map((item) => (
                      <div key={item.product._id} className="flex items-center">
                        {(() => {
                          const productName = item.product.parentProductName || item.product.name;
                          const imageUrl = item.product.images?.[0]?.url || `https://placehold.co/48x48/FEE2E2/EF4444?text=${(productName || '?')[0]}`;
                          return (
                            <>
                              <img
                                src={imageUrl}
                                alt={productName}
                                className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                                onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/48x48/FEE2E2/EF4444?text=${(productName || '?')[0]}` }}
                              />
                              <div className="ml-3 flex-auto min-w-0 pr-2">
                                <h4 className="text-sm font-medium text-gray-800 truncate">
                                  {productName}
                                </h4>
                                {item.product.attributes && Object.values(item.product.attributes).length > 0 && (
                                  <div className="flex flex-wrap gap-2 my-1">
                                    {Object.values(item.product.attributes).map((value, idx) => (
                                      <span
                                        key={idx}
                                        className="rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-semibold border border-purple-200"
                                      >
                                        {value}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <span className="text-sm font-medium text-gray-800 w-24 text-right flex-shrink-0">
                                ₹{(item.product.price * item.quantity).toFixed(2)}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center">Your cart is empty.</p>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    {shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <span>₹{shipping.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

            {/* Policy Acceptance */}
            <div className="mt-6 space-y-3 text-sm text-gray-700">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-pink-600 border-gray-300 rounded"
                  checked={acceptedShippingPolicy}
                  onChange={(e) => setAcceptedShippingPolicy(e.target.checked)}
                />
                <span>
                  I have read and agree to the{' '}
                  <Link to="/shipping" className="text-pink-600 underline">
                    Shipping Policy
                  </Link>
                  .
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-pink-600 border-gray-300 rounded"
                  checked={acceptedReturnPolicy}
                  onChange={(e) => setAcceptedReturnPolicy(e.target.checked)}
                />
                <span>
                  I have read and agree to the{' '}
                  <Link to="/returns" className="text-pink-600 underline">
                    Return &amp; Refund Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

                {/* Place Order Button */}
                <div className="mt-6">
                  <button
                    onClick={handleSubmit}
                    disabled={disablePlaceOrder}
                    className="w-full px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
};

export default CheckoutPage;