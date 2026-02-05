import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Package, 
  Edit, 
  Save, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Eye as EyeIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetMyOrdersQuery } from '../../store/api/ordersApi';
import { useUpdateUserMutation } from '../../store/api/usersApi';
import { logout, updateUserData } from '../../store/slices/userAuthSlice';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.userAuth);
  
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Lock background scroll when order modal is open
  useEffect(() => {
    if (showOrderModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showOrderModal]);

  // Form data for editing (using fullName like CheckoutPage)
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    mobileNo: user?.phone || '',
    address: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
  });

  // Generate profile initials from full name
  const getProfileInitials = () => {
    const name = user?.name || '';
    if (!name.trim()) {
      return null;
    }
    
    const nameParts = name.trim().split(' ').filter(Boolean);
    const firstInitial = nameParts[0]?.charAt(0).toUpperCase() || '';
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.charAt(0).toUpperCase() : '';
    
    return `${firstInitial}${lastInitial}`;
  };

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch user orders
  const { data: orders, isLoading: isLoadingOrders, error: ordersError } = useGetMyOrdersQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user?.name || '',
        mobileNo: user?.phone || '',
        address: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        postalCode: user?.address?.postalCode || '',
      });
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      const updateData = {
        name: formData.fullName.trim(),
        phone: formData.mobileNo,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
        }
      };

      const result = await updateUser({ userId: user._id, userData: updateData }).unwrap();
      
      // Update the user data in Redux store
      if (result.user) {
        dispatch(updateUserData(result.user));
      }
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.data?.message || 'Failed to update profile');
    }
  };

  // Removed change password feature per request

  // Cancel editing
  const handleCancelEdit = () => {
    setFormData({
      fullName: user?.name || '',
      mobileNo: user?.phone || '',
      address: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      postalCode: user?.address?.postalCode || '',
    });
    setIsEditing(false);
  };

  // Cancel password editing
  const handleCancelPasswordEdit = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsEditingPassword(false);
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    toast.success('Logged out successfully');
  };

  // Copy order ID
  const copyOrderId = async (orderId) => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      toast.success('Order ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy order ID');
    }
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'Processing':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock };
      case 'Shipped':
        return { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Truck };
      case 'Delivered':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: AlertCircle };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 animate-spin border-4 border-pink-200 border-t-pink-600 rounded-full"></div>
          <p className="text-lg text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-600">Manage your account and view your orders</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                {/* Profile Header */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    {getProfileInitials() ? (
                      <span className="text-2xl font-bold text-white">
                        {getProfileInitials()}
                      </span>
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {user.name || 'User Profile'}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">
                      {orders?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Orders</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {orders?.filter(order => order.orderStatus === 'Delivered').length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Delivered</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/products')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center px-3 py-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isUpdating}
                        className="flex items-center px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          name="mobileNo"
                          value={formData.mobileNo}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <p className="text-gray-900">{user.name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Address Information */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      ) : (
                        <p className="text-gray-900">{user.address?.street || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      ) : (
                        <p className="text-gray-900">{user.address?.city || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      ) : (
                        <p className="text-gray-900">{user.address?.state || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      ) : (
                        <p className="text-gray-900">{user.address?.postalCode || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change removed per request */}

              {/* Order History */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Order History</h3>
                  <Package className="w-6 h-6 text-gray-400" />
                </div>

                {isLoadingOrders ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 mx-auto mb-4 animate-spin border-4 border-pink-200 border-t-pink-600 rounded-full"></div>
                    <p className="text-gray-600">Loading orders...</p>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-gray-600">Failed to load orders</p>
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const statusInfo = getStatusInfo(order.orderStatus);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <div key={order._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-full ${statusInfo.bgColor}`}>
                                <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-gray-900">Order #{order.oid}</h4>
                                <p className="text-sm text-gray-500 font-medium">{formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}>
                                {order.orderStatus}
                              </span>
                              <button
                                onClick={() => copyOrderId(order.oid)}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                              >
                                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-base text-gray-600 font-medium">
                                {order.orderItems?.length || 0} items
                              </span>
                              <span className="text-lg font-bold text-gray-900">
                                ₹{order.totalPrice?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>

                          {/* Delivery Information */}
                          <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center text-gray-600">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span className="text-sm font-medium">{order.deliveryMethod}</span>
                                </div>
                                {order.deliverySpeed && (
                                  <div className="flex items-center text-gray-600">
                                    <Truck className="w-4 h-4 mr-2" />
                                    <span className="text-sm font-medium capitalize">{order.deliverySpeed} Delivery</span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowOrderModal(true);
                                }}
                                className="text-pink-600 hover:text-pink-700 font-semibold text-sm hover:underline transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">No orders yet</p>
                    <button
                      onClick={() => navigate('/products')}
                      className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div 
          className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowOrderModal(false);
            setSelectedOrder(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Order Header */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Order #{selectedOrder.oid}</h4>
                    <p className="text-sm text-gray-600">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₹{selectedOrder.totalPrice?.toFixed(2) || '0.00'}</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusInfo(selectedOrder.orderStatus).bgColor} ${getStatusInfo(selectedOrder.orderStatus).color}`}>
                      {selectedOrder.orderStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{item.name}</h5>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        {item.variantSku && (
                          <p className="text-xs text-gray-500">SKU: {item.variantSku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{item.price?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{selectedOrder.deliveryMethod}</span>
                  </div>
                  {selectedOrder.deliverySpeed && (
                    <div className="flex items-center space-x-3">
                      <Truck className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700 capitalize">{selectedOrder.deliverySpeed} Delivery</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">₹{selectedOrder.totalPrice?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;