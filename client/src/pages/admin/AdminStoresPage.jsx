// src/pages/AdminStoresPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetAllStoresQuery,
  useCreateStoreMutation,
  useDeleteStoreMutation,
} from '../../store/api/storesApi'; // Import the new storesApi
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { toast } from 'react-toastify';

// Zod schema for the new store form
const newStoreSchema = z.object({
  name: z.string().min(3, 'Store name must be at least 3 characters'),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    apartment: z.string().optional(), // Optional
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal Code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
});

const AdminStoresPage = () => {
  const navigate = useNavigate();
  // Destructure isError and error from the query hook
  const { data: stores, isLoading, isError, error, refetch } = useGetAllStoresQuery();
  const [createStore, { isLoading: isCreatingStore }] = useCreateStoreMutation();
  const [deleteStore, { isLoading: isDeletingStore }] = useDeleteStoreMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form setup for adding new store
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm({
    resolver: zodResolver(newStoreSchema),
    defaultValues: {
      name: '',
      address: {
        street: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the filteredStores logic below
  };

  const openDeleteModal = (id) => {
    setStoreToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setStoreToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;

    try {
      await deleteStore(storeToDelete).unwrap();
      toast.success('Store deleted successfully');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete store');
      console.error("Delete error:", error);
    } finally {
      closeDeleteModal();
    }
  };

  const handleCreateStore = async (data) => {
    try {
      await createStore(data).unwrap();
      toast.success('Store added successfully');
      resetForm(); // Clear the form
    } catch (error) {
      console.error("Create store error:", error);
      toast.error(error?.data?.message || 'Failed to add store');
    }
  };

  const filteredStores = stores?.filter((store) => {
    const matchesSearch = searchTerm
      ? store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.phone.includes(searchTerm)
      : true;
    return matchesSearch;
  });

  return (
    <div className="p-4 md:p-8">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Stores</h1>
          <p className="text-gray-600">Manage your physical store locations</p>
        </div>
      </div>

      {/* Add New Store Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Store</h2>
        <form onSubmit={handleSubmit(handleCreateStore)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Store Name */}
            <div>
              <label htmlFor="name" className="label">
                Store Name <span className="text-error-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                className={`input ${errors.name ? 'border-error-500' : ''}`}
                {...register('name')}
                disabled={isCreatingStore}
              />
              {errors.name && (
                <p className="error-message">{errors.name.message}</p>
              )}
            </div>
            {/* Phone */}
            <div>
              <label htmlFor="phone" className="label">
                Phone Number <span className="text-error-500">*</span>
              </label>
              <input
                id="phone"
                type="text"
                className={`input ${errors.phone ? 'border-error-500' : ''}`}
                {...register('phone')}
                disabled={isCreatingStore}
              />
              {errors.phone && (
                <p className="error-message">{errors.phone.message}</p>
              )}
            </div>
            {/* Email */}
            <div className="md:col-span-2">
              <label htmlFor="email" className="label">
                Email <span className="text-error-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`input ${errors.email ? 'border-error-500' : ''}`}
                {...register('email')}
                disabled={isCreatingStore}
              />
              {errors.email && (
                <p className="error-message">{errors.email.message}</p>
              )}
            </div>

            {/* Address Fields */}
            <h3 className="md:col-span-2 text-lg font-semibold mt-4 mb-2">Address</h3>
            <div>
              <label htmlFor="street" className="label">
                Street <span className="text-error-500">*</span>
              </label>
              <input
                id="street"
                type="text"
                className={`input ${errors.address?.street ? 'border-error-500' : ''}`}
                {...register('address.street')}
                disabled={isCreatingStore}
              />
              {errors.address?.street && (
                <p className="error-message">{errors.address.street.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="apartment" className="label">
                Apartment (Optional)
              </label>
              <input
                id="apartment"
                type="text"
                className={`input ${errors.address?.apartment ? 'border-error-500' : ''}`}
                {...register('address.apartment')}
                disabled={isCreatingStore}
              />
              {errors.address?.apartment && (
                <p className="error-message">{errors.address.apartment.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="city" className="label">
                City <span className="text-error-500">*</span>
              </label>
              <input
                id="city"
                type="text"
                className={`input ${errors.address?.city ? 'border-error-500' : ''}`}
                {...register('address.city')}
                disabled={isCreatingStore}
              />
              {errors.address?.city && (
                <p className="error-message">{errors.address.city.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="state" className="label">
                State <span className="text-error-500">*</span>
              </label>
              <input
                id="state"
                type="text"
                className={`input ${errors.address?.state ? 'border-error-500' : ''}`}
                {...register('address.state')}
                disabled={isCreatingStore}
              />
              {errors.address?.state && (
                <p className="error-message">{errors.address.state.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="postalCode" className="label">
                Postal Code <span className="text-error-500">*</span>
              </label>
              <input
                id="postalCode"
                type="text"
                className={`input ${errors.address?.postalCode ? 'border-error-500' : ''}`}
                {...register('address.postalCode')}
                disabled={isCreatingStore}
              />
              {errors.address?.postalCode && (
                <p className="error-message">{errors.address.postalCode.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="country" className="label">
                Country <span className="text-error-500">*</span>
              </label>
              <input
                id="country"
                type="text"
                className={`input ${errors.address?.country ? 'border-error-500' : ''}`}
                {...register('address.country')}
                disabled={isCreatingStore}
              />
              {errors.address?.country && (
                <p className="error-message">{errors.address.country.message}</p>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isCreatingStore}
              className="btn btn-primary"
            >
              {isCreatingStore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-2" /> Add Store
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Stores List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Existing Stores</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pr-14 w-full py-2.5"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 text-gray-400 hover:text-primary-500 hover:bg-gray-100 transition-colors"
                >
                  <Search size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Conditional Rendering based on Loading and Error States */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="ml-4 text-gray-600">Loading stores...</p>
          </div>
        ) : isError ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-center">
            <strong className="font-bold">Error loading stores!</strong>
            <span className="block sm:inline ml-2">
              {error?.data?.message || 'An unknown error occurred while fetching stores.'}
            </span>
            <button onClick={() => refetch()} className="ml-4 text-blue-700 hover:underline">
              Retry
            </button>
          </div>
        ) : filteredStores?.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No stores found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Add stores using the form above.'}
            </p>
          </div>
        ) : (
          <>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStores.map((store) => (
                  <tr key={store._id} className="hover:bg-gray-50 align-top">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium text-gray-900">{store.name}</div>
                      <div className="mt-1 text-gray-600 whitespace-normal break-words">
                        <div>
                          {store.address.street}{store.address.apartment ? `, ${store.address.apartment}` : ''}
                        </div>
                        <div>
                          {store.address.city}, {store.address.state} {store.address.postalCode}
                        </div>
                        <div>
                          {store.address.country}
                        </div>
                      </div>
                      <div className="mt-2 text-gray-600 whitespace-normal break-words">
                        <div className="flex items-center"><Phone size={14} className="mr-1 text-gray-400" /> {store.phone}</div>
                        <div className="flex items-center mt-1"><Mail size={14} className="mr-1 text-gray-400" /> {store.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(store.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Edit functionality: you might link to a dedicated edit page if complex, or open a modal */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toast.info("Edit Store functionality coming soon!"); }}
                          className="text-primary-500 hover:text-primary-600"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeleteModal(store._id); }}
                          className="text-error-500 hover:text-error-600"
                          disabled={isDeletingStore}
                        >
                          {isDeletingStore && storeToDelete === store._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile/Tablet card list */}
          <div className="lg:hidden space-y-3">
            {filteredStores.map((store) => (
              <div key={store._id} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    {/* name */}
                    <h3 className="text-sm font-medium text-gray-900 break-words">{store.name}</h3>
                    {/* street, apartment (wrap if) */}
                    <div className="mt-1 text-xs text-gray-600 whitespace-normal break-words">
                      {store.address.street}{store.address.apartment ? `, ${store.address.apartment}` : ''}
                    </div>
                    {/* city, state, pin code, country (wrap if) */}
                    <div className="mt-1 text-xs text-gray-600 whitespace-normal break-words">
                      {store.address.city}, {store.address.state}, {store.address.postalCode}, {store.address.country}
                    </div>
                    {/* phone number */}
                    <div className="mt-2 flex items-center text-xs text-gray-600 whitespace-normal break-words">
                      <Phone size={12} className="mr-1 text-gray-400" /> {store.phone}
                    </div>
                    {/* email */}
                    <div className="mt-1 flex items-center text-xs text-gray-600 whitespace-normal break-words">
                      <Mail size={12} className="mr-1 text-gray-400" /> {store.email}
                    </div>
                    {/* created at */}
                    <div className="mt-1 text-[10px] text-gray-400 whitespace-normal break-words">
                      {new Date(store.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <button onClick={(e) => { e.stopPropagation(); toast.info("Edit Store functionality coming soon!"); }} className="p-1 text-primary-600 hover:text-primary-800">
                      <Edit size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openDeleteModal(store._id); }} className="p-1 text-error-600 hover:text-error-800" disabled={isDeletingStore}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
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
            <h3 className="text-xl font-bold text-center mb-4">Delete Store</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this store? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={closeDeleteModal} className="btn btn-outline" disabled={isDeletingStore}>
                Cancel
              </button>
              <button onClick={handleDeleteStore} className="btn bg-error-500 text-white hover:bg-error-600" disabled={isDeletingStore}>
                {isDeletingStore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} className="mr-2" /> Delete
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

export default AdminStoresPage;
