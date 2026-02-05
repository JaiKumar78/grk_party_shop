import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  useGetProductsQuery 
} from '../../store/api/productsApi';
import { 
  useGetAllOrdersQuery 
} from '../../store/api/ordersApi';
import { 
  useGetUsersQuery 
} from '../../store/api/usersApi';
import { 
  Package, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  BarChart3,
  Calendar,
  MapPin
} from 'lucide-react';

const AdminDashboardPage = () => {
  const { data: products, isLoading: productsLoading } = useGetProductsQuery();
  const { data: orders, isLoading: ordersLoading } = useGetAllOrdersQuery();
  const { data: users, isLoading: usersLoading } = useGetUsersQuery();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Calculate metrics
  const totalRevenue = orders?.reduce((sum, order) => sum + (order.totalPrice || 0), 0) || 0;
  const pendingOrders = orders?.filter(order => order.orderStatus === 'Processing').length || 0;
  const lowStockProducts = products?.filter(product => !product.inStock || product.stock < 10).length || 0;

  // Order status counts
  const orderStatusCounts = {
    processing: orders?.filter(order => order.orderStatus === 'Processing').length || 0,
    shipped: orders?.filter(order => order.orderStatus === 'Shipped').length || 0,
    delivered: orders?.filter(order => order.orderStatus === 'Delivered').length || 0,
  };

  // Recent orders (last 5)
  const recentOrders = orders?.slice(0, 5) || [];

  // Loading state
  const isLoading = productsLoading || ordersLoading || usersLoading;

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to the PartyShop Admin Dashboard</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-blue-100 mr-4">
              <Package size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-500">Total Products</h3>
              <p className="text-2xl font-bold text-gray-800">{products?.length || 0}</p>
            </div>
          </div>
        </motion.div>
        
        {/* Total Orders */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-green-100 mr-4">
              <ShoppingCart size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-500">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-800">{orders?.length || 0}</p>
            </div>
          </div>
        </motion.div>
        
        {/* Total Users */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-purple-100 mr-4">
              <Users size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-500">Total Users</h3>
              <p className="text-2xl font-bold text-gray-800">{users?.length || 0}</p>
            </div>
          </div>
        </motion.div>
        
        {/* Total Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-yellow-100 mr-4">
              <DollarSign size={24} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-500">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-800">₹{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Order Status and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Order Statistics */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <BarChart3 size={24} className="mr-2 text-blue-600" />
            Order Statistics
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
              <h3 className="text-lg font-medium text-orange-600 mb-1">Processing</h3>
              <p className="text-3xl font-bold text-orange-700">{orderStatusCounts.processing}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
              <h3 className="text-lg font-medium text-blue-600 mb-1">Shipped</h3>
              <p className="text-3xl font-bold text-blue-700">{orderStatusCounts.shipped}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
              <h3 className="text-lg font-medium text-green-600 mb-1">Delivered</h3>
              <p className="text-3xl font-bold text-green-700">{orderStatusCounts.delivered}</p>
            </div>
          </div>
        </motion.div>
        
        {/* Alerts */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <AlertCircle size={24} className="mr-2 text-red-600" />
            Alerts
          </h2>
          <ul className="space-y-4">
            {pendingOrders > 0 && (
              <li className="flex items-start">
                <Clock size={20} className="text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Pending Orders</p>
                  <p className="text-sm text-gray-600">
                    {pendingOrders} {pendingOrders === 1 ? 'order needs' : 'orders need'} processing
                  </p>
                  <Link
                    to="/admin/orders?status=Processing"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Orders →
                  </Link>
                </div>
              </li>
            )}
            {lowStockProducts > 0 && (
              <li className="flex items-start">
                <AlertCircle size={20} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Low Stock Alert</p>
                  <p className="text-sm text-gray-600">
                    {lowStockProducts} {lowStockProducts === 1 ? 'product is' : 'products are'} low in stock
                  </p>
                  <Link
                    to="/admin/products"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Products →
                  </Link>
                </div>
              </li>
            )}
            {pendingOrders === 0 && lowStockProducts === 0 && (
              <li className="flex items-start">
                <div className="rounded-full p-1 bg-green-100 mr-2">
                  <TrendingUp size={16} className="text-green-600" />
                </div>
                <p className="text-gray-600">No urgent alerts at this time</p>
              </li>
            )}
          </ul>
        </motion.div>
      </div>
      
      {/* Recent Orders */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <Calendar size={24} className="mr-2 text-green-600" />
            Recent Orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => {
                  const { badge, icon } = getStatusInfo(order.orderStatus);
                  
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {(order.oid || order._id).slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {order.fullName || `${order.firstName || ''} ${order.lastName || ''}`.trim()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
                          {icon}
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                        ₹{order.totalPrice?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/admin/orders?id=${order._id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
      
      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Plus size={24} className="mr-2 text-purple-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <Link
            to="/admin/products/new"
            className="flex items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
          >
            <Plus size={18} className="text-blue-600 mr-2" />
            <span className="font-medium text-blue-700">Add New Product</span>
          </Link>
          <Link
            to="/admin/orders"
            className="flex items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 border border-green-200"
          >
            <Package size={18} className="text-green-600 mr-2" />
            <span className="font-medium text-green-700">Manage Orders</span>
          </Link>
          <Link
            to="/admin/products"
            className="flex items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200 border border-purple-200"
          >
            <Package size={18} className="text-purple-600 mr-2" />
            <span className="font-medium text-purple-700">View All Products</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboardPage;