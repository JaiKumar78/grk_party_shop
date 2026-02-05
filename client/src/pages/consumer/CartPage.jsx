import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  removeItem,
  incrementQuantity,
  decrementQuantity,
  clearCart
} from '../../store/slices/cartSlice';
import { Trash2, Plus, Minus, ShoppingBag, XCircle, AlertCircle, ShoppingCart } from 'lucide-react'; // Added ShoppingCart for new button
import { toast } from 'react-toastify';
import { motion } from 'framer-motion'; // Added framer-motion import

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, totalQuantity, totalAmount } = useSelector((state) => state.cart);

  // State for the clear cart confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearingCart, setIsClearingCart] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on page load
  }, []);

  const handleRemoveItem = (productId, variantId = null) => {
    dispatch(removeItem({ productId, variantId }));
    toast.info('Item removed from cart!');
  };

  const handleIncrementQuantity = (productId, variantId = null) => {
    dispatch(incrementQuantity({ productId, variantId }));
  };

  const handleDecrementQuantity = (productId, variantId = null) => {
    dispatch(decrementQuantity({ productId, variantId }));
  };

  const handleClearCartClick = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmClearCart = () => {
    setIsClearingCart(true); // Start loading state
    setTimeout(() => {
      dispatch(clearCart());
      toast.success('Cart cleared successfully!');
      setIsClearingCart(false); // End loading state
      setIsDeleteModalOpen(false); // Close the modal
    }, 500); // Simulate network delay
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleProceedToCheckout = () => {
    // toast.info("Proceeding to checkout (functionality coming soon)!");
    navigate('/checkout'); // Assuming a /checkout route exists or will exist
  };

  const handleContinueShopping = () => {
    navigate('/products'); // Navigate to your products page
  };

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <ShoppingBag className="text-gray-400 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-600 mb-6">
          Looks like you haven't added anything to your cart yet.
          Start shopping to find great party supplies!
        </p>
        <Link to="/products" className="btn btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Your Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            {items.map((item) => (
              <div key={item.product._id} className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 py-4 last:border-b-0">
                <div className="flex items-center flex-grow mb-4 sm:mb-0">
                  <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={item.product.images[0]?.url || `https://placehold.co/96x96/cccccc/333333?text=No+Image`}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = `https://placehold.co/96x96/cccccc/333333?text=Image+Error`; e.currentTarget.onerror = null; }}
                    />
                  </div>
                  <div className="ml-4">
                    {(() => {
                      const productName = item.product.parentProductName || item.product.name || 'View Product';
                      const productSlugOrId =
                        item.product.parentProductSlug ||
                        item.product.slug ||
                        item.product.parentProductId ||
                        item.product._id;
                      const toHref = productSlugOrId ? `/collections/${productSlugOrId}` : '/products';
                      return (
                        <Link to={toHref} className="text-lg font-semibold text-gray-800 hover:text-pink-600">
                          {productName}
                        </Link>
                      );
                    })()}
                    {/* Variant property indicator */}
                    {item.product.attributes && Object.values(item.product.attributes).length > 0 && (
                      <div className="flex flex-wrap gap-2 my-2">
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
                    <p className="text-gray-600">₹{(item.product.price || 0).toFixed(2)}</p>
                    {item.product.stock === 0 && (
                        <span className="text-red-500 text-sm font-medium">Out of Stock</span>
                    )}
                    {item.product.stock > 0 && item.quantity > item.product.stock && (
                        <span className="text-orange-500 text-sm font-medium">Only {item.product.stock} in stock!</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleDecrementQuantity(item.product._id, item.product.variantId)}
                      className="p-2 text-gray-700 hover:bg-gray-100 rounded-l-md disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-3 py-1 border-x border-gray-300 font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrementQuantity(item.product._id, item.product.variantId)}
                      className="p-2 text-gray-700 hover:bg-gray-100 rounded-r-md disabled:opacity-50"
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <p className="text-lg font-bold text-gray-800 w-20 text-right">
                    ₹{((item.product.price || 0) * item.quantity).toFixed(2)}
                  </p>

                  <button
                    onClick={() => handleRemoveItem(item.product._id, item.product.variantId)}
                    className="text-error-500 hover:text-error-700 p-2 rounded-md transition-colors"
                    aria-label={`Remove ${item.product.name} from cart`}
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-700">
                <span>Total Items:</span>
                <span className="font-medium">{totalQuantity}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
              </div>
              {/* Add more summary lines as needed (e.g., shipping, tax) */}
              <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-3 mt-3">
                <span>Order Total:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Taxes, discounts and shipping calculated at checkout
              </p>
            </div>

            {/* NEW: Continue Shopping Button */}
            <button
              onClick={handleContinueShopping}
              className="btn btn-outline w-full flex items-center justify-center gap-2 mb-4 cursor-pointer"
            >
              <ShoppingCart size={20} />
              Continue Shopping
            </button>

            <button
              onClick={handleProceedToCheckout}
              className="btn btn-primary w-full flex items-center justify-center gap-2 mb-4 cursor-pointer"
            >
              <ShoppingBag size={20} />
              Proceed to Checkout
            </button>
            <button
              onClick={handleClearCartClick}
              className="btn btn-outline-error w-full flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 size={18} />
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full"
          >
            <div className="flex items-center justify-center text-error-500 mb-4">
              <AlertCircle size={48} />
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Clear Cart</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to clear the cart? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={closeDeleteModal} className="btn btn-outline" disabled={isClearingCart}>
                Cancel
              </button>
              <button onClick={confirmClearCart} className="btn bg-error-500 text-white hover:bg-error-600" disabled={isClearingCart}>
                {isClearingCart ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} className="mr-2" /> Clear Cart
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
