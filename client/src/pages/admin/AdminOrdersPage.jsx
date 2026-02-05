import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  useGetAllOrdersQuery, 
  useUpdateOrderStatusMutation,
} from '../../store/api/ordersApi';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Package, 
  CheckCircle, 
  XCircle,
  Eye
} from 'lucide-react';

const statusOptions = ['Processing', 'Shipped', 'Delivered'];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'total-high-low', label: 'Total (High to Low)' },
  { value: 'total-low-high', label: 'Total (Low to High)' },
];

const AdminOrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // State for backend-driven filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status'));
  const [sortBy, setSortBy] = useState('newest');
  // Query params for backend
  const queryParams = {
    search: searchTerm,
    status: statusFilter,
    sort: sortBy,
  };
  const { data: orders, isLoading, refetch } = useGetAllOrdersQuery(queryParams);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  
  const [expandedOrders, setExpandedOrders] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const statusDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Set initial status filter from URL params
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
    }
    
    // Check for specific order ID to expand
    const orderId = searchParams.get('id');
    if (orderId) {
      setExpandedOrders({ [orderId]: true });
    }
  }, [searchParams]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // No-op: searchTerm is already reactive, but could trigger a refetch or update params if needed
  };

  // Toggle order details
  const toggleOrderDetails = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Filter by status
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    
    // Update URL params
    if (status) {
      searchParams.set('status', status);
    } else {
      searchParams.delete('status');
    }
    setSearchParams(searchParams);
  };

  // Update order status
  const handleUpdateStatus = async (orderId, status) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus({ orderId, newStatus: status }).unwrap();
      toast.success(`Order status updated to ${status}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'Processing':
        return { 
          badge: 'badge-warning', 
          icon: <Clock size={16} className="mr-1" /> 
        };
      case 'Shipped':
        return { 
          badge: 'badge-primary', 
          icon: <Package size={16} className="mr-1" /> 
        };
      case 'Delivered':
        return { 
          badge: 'badge-success', 
          icon: <CheckCircle size={16} className="mr-1" /> 
        };
      default:
        return { 
          badge: 'badge-gray-100 text-gray-800', 
          icon: null 
        };
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <p className="text-gray-600">Manage and track customer orders</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Filters */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter & Search Orders</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Search Orders</label>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by Order ID (GRK-...), customer name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 outline-none border border-gray-300 rounded-lg focus:ring focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-medium"
                    onBlur={e => {
                      setIsStatusDropdownOpen(false);
                      setIsSortDropdownOpen(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        setIsStatusDropdownOpen(false);
                        setIsSortDropdownOpen(false);
                        e.target.blur();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                    aria-label="Search"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </form>
            </div>
            
            {/* Status Filter (Custom Dropdown) */}
            <div className="space-y-2 relative" ref={statusDropdownRef}>
              <label className="block text-sm font-medium text-gray-700">Order Status</label>
              <button
                type="button"
                className={`w-full ${statusFilter ? 'text-gray-800' : 'text-gray-500'} px-4 py-3 border border-gray-300 rounded-lg flex justify-between items-center font-medium bg-white focus:ring focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${isStatusDropdownOpen ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => setIsStatusDropdownOpen((open) => !open)}
                onBlur={e => {
                  // Only close if focus moves outside the dropdown
                  if (!e.relatedTarget || !statusDropdownRef.current.contains(e.relatedTarget)) {
                    setIsStatusDropdownOpen(false);
                  }
                }}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Escape') setIsStatusDropdownOpen(false);
                }}
              >
                <span>{statusFilter || 'All Statuses'}</span>
                <ChevronDown size={20} className={`ml-2 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isStatusDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full min-w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <ul className="py-1 max-h-60 overflow-y-auto">
                    <li
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${!statusFilter ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                      onClick={() => { handleStatusFilter(null); setIsStatusDropdownOpen(false); }}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Escape') setIsStatusDropdownOpen(false); }}
                    >
                      All Statuses
                    </li>
                    {statusOptions.map((status) => (
                      <li
                        key={status}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${statusFilter === status ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                        onClick={() => { handleStatusFilter(status); setIsStatusDropdownOpen(false); }}
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Escape') setIsStatusDropdownOpen(false); }}
                      >
                        {status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Sort (Custom Dropdown) */}
            <div className="space-y-2 relative" ref={sortDropdownRef}>
              <label className="block text-sm font-medium text-gray-700">Sort By</label>
              <button
                type="button"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg flex justify-between items-center font-medium bg-white focus:ring focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${isSortDropdownOpen ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => setIsSortDropdownOpen((open) => !open)}
                onBlur={e => {
                  if (!e.relatedTarget || !sortDropdownRef.current.contains(e.relatedTarget)) {
                    setIsSortDropdownOpen(false);
                  }
                }}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Escape') setIsSortDropdownOpen(false);
                }}
              >
                <span>{sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort'}</span>
                <ChevronDown size={20} className={`ml-2 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSortDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full min-w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <ul className="py-1 max-h-60 overflow-y-auto">
                    {sortOptions.map((opt) => (
                      <li
                        key={opt.value}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${sortBy === opt.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                        onClick={() => { setSortBy(opt.value); setIsSortDropdownOpen(false); }}
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Escape') setIsSortDropdownOpen(false); }}
                      >
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter
                ? `No orders found for "${searchTerm || statusFilter}". Try adjusting your filters or search terms.`
                : 'No orders have been placed yet.'}
            </p>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  handleStatusFilter(null);
                }}
                className="btn btn-primary flex items-center mx-auto"
              >
                <Filter size={18} className="mr-2" /> Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map((order) => {
              const { badge, icon } = getStatusInfo(order.orderStatus);
              const isExpanded = expandedOrders[order._id] || false;
              
              return (
                <div key={order._id} className="border rounded-lg overflow-hidden">
                  {/* Order Header */}
                  <div 
                    className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                    onClick={() => toggleOrderDetails(order._id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Order ID</span>
                        <span className="font-mono text-sm font-semibold text-gray-800 block">{order.oid || order._id}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Date</span>
                        <span className="text-sm font-medium text-gray-800 block">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Customer</span>
                        <span className="text-sm font-medium text-gray-800 block">
                          {order.fullName || `${order.firstName || ''} ${order.lastName || ''}`.trim()}
                        </span>
                      </div>
                      <div className="space-y-1 flex items-center gap-2">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Status</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge} align-middle`} style={{alignSelf: 'center'}}>
                          {icon}
                          {order.orderStatus}
                        </span>
                      </div>
                      <div className="space-y-1 flex items-center gap-2">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Delivery</span>
                        {order.deliveryMethod === 'Store Pickup' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Store Pickup</span>
                        ) : order.deliverySpeed === 'quick' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">Quick</span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Normal</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center mt-4 sm:mt-0 space-x-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide block">Total</span>
                        <span className="text-xl font-bold text-gray-800">₹{order.totalPrice?.toFixed(2)}</span>
                      </div>
                      <div className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white border-t border-gray-200"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Order Items */}
                          <div className="lg:col-span-2">
                            <div className="bg-gray-50 rounded-lg p-6">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <Package size={20} className="mr-2 text-blue-600" />
                                Order Items ({order.orderItems?.length || 0})
                              </h4>
                              <div className="space-y-4">
                                {order.orderItems?.map((item, index) => (
                                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                    <div className="flex items-start space-x-4">
                                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                        <img
                                          src={item.image || '/placeholder-image.jpg'}
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.src = '/placeholder-image.jpg';
                                          }}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-semibold text-gray-800 text-sm mb-1">{item.name}</h5>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                          <span>Qty: {item.quantity}</span>
                                          <span>Price: ₹{item.price?.toFixed(2)}</span>
                                        </div>
                                        {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
                                          <div className="flex flex-wrap gap-2">
                                            {Object.entries(item.variantAttributes).map(([key, value]) => (
                                              <span 
                                                key={key} 
                                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                              >
                                                {key}: {value}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-gray-800 text-lg">
                                          ₹{(item.price * item.quantity)?.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Order Totals */}
                              <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
                                <h5 className="font-semibold text-gray-800 mb-3">Order Summary</h5>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">₹{order.itemsPrice?.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax:</span>
                                    <span className="font-medium">₹{order.taxPrice?.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping:</span>
                                    <span className="font-medium">
                                      {order.shippingPrice === 0 ? 'Free' : `₹${order.shippingPrice?.toFixed(2)}`}
                                    </span>
                                  </div>
                                  <div className="border-t pt-2 mt-3 border-gray-300">
                                    <div className="flex justify-between">
                                      <span className="font-bold text-gray-800">Total:</span>
                                      <span className="font-bold text-xl text-gray-800">₹{order.totalPrice?.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Customer and Order Information */}
                          <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-lg p-6">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <Eye size={20} className="mr-2 text-green-600" />
                                Customer Information
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</span>
                                  <p className="text-sm font-medium text-gray-800">
                                    {order.fullName || `${order.firstName || ''} ${order.lastName || ''}`.trim()}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</span>
                                  <p className="text-sm font-medium text-gray-800">{order.customerEmail}</p>
                                </div>
                                {order.mobileNo && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</span>
                                    <p className="text-sm font-medium text-gray-800">{order.mobileNo}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Shipping Address */}
                            {order.shippingAddress && order.deliveryMethod !== 'Store Pickup' && (
                              <div className="bg-gray-50 rounded-lg p-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                  <Package size={20} className="mr-2 text-purple-600" />
                                  Shipping Address
                                </h4>
                                <address className="not-italic space-y-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {order.shippingAddress.fullName ||
                                      `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim()}
                                  </p>
                                  {order.shippingAddress.apartment && (
                                    <p className="text-sm text-gray-600">{order.shippingAddress.apartment}</p>
                                  )}
                                  <p className="text-sm text-gray-600">{order.shippingAddress.street}</p>
                                  <p className="text-sm text-gray-600">
                                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                  </p>
                                  <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
                                </address>
                              </div>
                            )}

                            {/* Pickup Store */}
                            {order.pickupStore && (
                              <div className="bg-gray-50 rounded-lg p-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                  <Package size={20} className="mr-2 text-orange-600" />
                                  Pickup Store
                                </h4>
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-gray-800">{order.pickupStore.name}</p>
                                  <p className="text-sm text-gray-600">{order.pickupStore.address?.street}</p>
                                  <p className="text-sm text-gray-600">
                                    {order.pickupStore.address?.city}, {order.pickupStore.address?.state}
                                  </p>
                                  <p className="text-sm text-gray-600">Phone: {order.pickupStore.phone}</p>
                                  <p className="text-sm text-gray-600">Email: {order.pickupStore.email}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Delivery Method */}
                            <div className="bg-gray-50 rounded-lg p-6">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <Package size={20} className="mr-2 text-indigo-600" />
                                Delivery Method
                              </h4>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 capitalize mr-2">
                                {order.deliveryMethod}
                              </span>
                              {order.deliveryMethod !== 'Store Pickup' && order.deliverySpeed && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ml-2 ${order.deliverySpeed === 'quick' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {order.deliverySpeed === 'quick' ? 'Quick Delivery' : 'Normal Delivery'}
                                </span>
                              )}
                            </div>
                            
                            {/* Order Status Update */}
                            <div className="bg-gray-50 rounded-lg p-6">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <CheckCircle size={20} className="mr-2 text-blue-600" />
                                Update Status
                              </h4>
                              <div className="space-y-3">
                                {statusOptions.map((status) => {
                                  const isCurrentStatus = order.orderStatus === status;
                                  const isDisabled = isCurrentStatus || isUpdating;
                                  
                                  return (
                                    <button
                                      key={status}
                                      onClick={() => handleUpdateStatus(order._id, status)}
                                      disabled={isDisabled}
                                      className={`w-full py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center ${
                                        isCurrentStatus
                                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-200 cursor-default'
                                          : status === 'Processing'
                                          ? 'bg-orange-50 text-orange-700 border-2 border-orange-200 hover:bg-orange-100 hover:border-orange-300 shadow-sm'
                                          : status === 'Shipped'
                                          ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-sm'
                                          : status === 'Delivered'
                                          ? 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-300 shadow-sm'
                                          : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300 shadow-sm'
                                      } ${isDisabled ? 'opacity-60' : 'hover:scale-105'}`}
                                    >
                                      {status}
                                      {isCurrentStatus && (
                                        <CheckCircle size={16} className="ml-2" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;