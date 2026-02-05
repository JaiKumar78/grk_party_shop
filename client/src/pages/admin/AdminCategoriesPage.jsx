import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form'; // For the new form
import { zodResolver } from '@hookform/resolvers/zod'; // For the new form
import { z } from 'zod'; // For the new form
import {
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '../../store/api/categoriesApi';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Filter,
  ArrowLeft,
  Save,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-toastify';

// Zod schema for the new category form on this page
const newCategorySchema = z.object({
  name: z.string().min(3, 'Category name must be at least 3 characters'),
});

const AdminCategoriesPage = () => {
  const navigate = useNavigate();
  const { data: categories, isLoading, refetch } = useGetAllCategoriesQuery();
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  const [deleteCategory, { isLoading: isDeletingCategory }] = useDeleteCategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // NEW: State for sorting
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [originalImagePreview, setOriginalImagePreview] = useState(null); // Track original image for edit mode
  const [inputKey, setInputKey] = useState(Date.now());
  const [editMode, setEditMode] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);

  const imageInputRef = useRef();

  // Form setup for adding new category
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm({
    resolver: zodResolver(newCategorySchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleSortChange = (sort) => { // NEW: Handle sort change
    setSortBy(sort);
  };

  const openDeleteModal = (id) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setCategoryToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete).unwrap();
      toast.success('Product Type deleted successfully');
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete product type');
      console.error("Delete error:", error);
    } finally {
      closeDeleteModal();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Only revoke if it's a blob URL (new file), not an existing image URL
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
      setImageFile(file);
    } else {
      // Only revoke if it's a blob URL
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      // If in edit mode, restore original image, otherwise set to null
      setImagePreview(editMode ? originalImagePreview : null);
      setImageFile(null);
    }
  };

  const handleRemoveImage = () => {
    // Only revoke if it's a blob URL (new file), not an existing image URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    setInputKey(Date.now());
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleEditCategory = (category) => {
    setEditMode(true);
    setEditCategoryId(category._id);
    resetForm({ name: category.name });
    const originalImage = category.image || null;
    setOriginalImagePreview(originalImage); // Store original image
    setImagePreview(originalImage);
    setImageFile(null);
    setInputKey(Date.now());
  };

  const handleCancelEdit = () => {
    // Only revoke blob URLs (new files), not original image URLs
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setEditMode(false);
    setEditCategoryId(null);
    resetForm({ name: '' });
    setImagePreview(null);
    setImageFile(null);
    setOriginalImagePreview(null);
    setInputKey(Date.now());
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Helper to reset all form fields and image state
  const resetAllFields = () => {
    resetForm();
    // Only revoke blob URLs (new files), not original image URLs
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    setOriginalImagePreview(null);
    setInputKey(Date.now());
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleSubmitCategory = async (data) => {
    // For new categories, image is required. For editing, it's optional (can keep existing)
    if (!editMode && !imagePreview && !imageFile) {
      toast.error('Image is required');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      // Only append image if a new file was selected
      if (imageFile) {
        formData.append('image', imageFile);
      }
      // In edit mode, if no new image file is provided, backend should keep existing image
      if (editMode && editCategoryId) {
        await updateCategory({ id: editCategoryId, formData }).unwrap();
        toast.success('Product Type updated successfully');
        handleCancelEdit();
      } else {
        await createCategory(formData).unwrap();
        toast.success('Product Type added successfully');
        resetAllFields();
      }
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || (editMode ? 'Failed to update product type' : 'Failed to add product type'));
    }
  };

  // Function to navigate to products page with category filter (FIXED)
  const navigateToProductsWithCategoryFilter = (categoryId) => {
    navigate(`/admin/products?productType=${categoryId}`); // Pass as URL search parameter
  };

  const filteredCategories = categories
    ?.filter((category) => {
      const matchesSearch = searchTerm
        ? category.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesSearch;
    })
    .sort((a, b) => { // NEW: Client-side sorting
        switch (sortBy) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'newest':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

  return (
    <div className="p-4 md:p-8">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Types</h1>
          <p className="text-gray-600">Manage your product categories and add new ones</p>
        </div>
      </div>

      {/* Add New Product Type Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Product Type</h2>
        <form onSubmit={handleSubmit(handleSubmitCategory)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="newCategoryName" className="label">
                Product Type Name <span className="text-error-500">*</span>
              </label>
              <input
                id="newCategoryName"
                type="text"
                className={`input ${errors.name ? 'border-error-500' : ''}`}
                {...register('name')}
                disabled={isCreatingCategory || isUpdatingCategory}
              />
              {errors.name && (
                <p className="error-message">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="label">Image</label>
              <div className="flex items-center gap-4 mb-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="btn btn-primary flex items-center gap-2"
                  disabled={isCreatingCategory || isUpdatingCategory}
                >
                  <Upload size={18} />
                  Upload from device
                </button>
                <input
                  key={inputKey}
                  id="categoryImageUploadInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isCreatingCategory || isUpdatingCategory}
                  ref={imageInputRef}
                />
              </div>
              {imagePreview ? (
                <div className="relative w-32 h-32 mt-2">
                  <img src={imagePreview} alt="Preview" className="object-cover w-full h-full rounded-md border" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-error-500 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center w-32 h-32 flex flex-col items-center justify-center">
                  <ImageIcon size={24} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-gray-500 text-xs">No image</p>
                </div>
              )}
              {errors.image && (
                <p className="error-message">{errors.image.message}</p>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            {editMode && (
              <button type="button" className="btn btn-outline" onClick={handleCancelEdit} disabled={isCreatingCategory || isUpdatingCategory}>
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isCreatingCategory || isUpdatingCategory}
              className="btn btn-primary"
            >
              {(isCreatingCategory || isUpdatingCategory) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editMode ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-2" /> {editMode ? 'Update Product Type' : 'Add Product Type'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Product Types List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Existing Product Types</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search product types..."
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

          {/* NEW: Sort */}
          <div className="w-full md:w-64">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="input w-full"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Categories Table (Desktop) */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredCategories?.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No product types found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Add product types using the form above.'}
            </p>
          </div>
        ) : (
          <>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigateToProductsWithCategoryFilter(category._id)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {category.image ? (
                        <img src={category.image} alt={category.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded">
                          <ImageIcon size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditCategory(category); }}
                          className="text-primary-500 hover:text-primary-600"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeleteModal(category._id); }}
                          className="text-error-500 hover:text-error-600"
                          disabled={isDeletingCategory}
                        >
                          {isDeletingCategory && categoryToDelete === category._id ? (
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
            {filteredCategories.map((category) => (
              <div key={category._id} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigateToProductsWithCategoryFilter(category._id)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="h-8 w-8 flex-shrink-0 rounded-md overflow-hidden mr-3">
                      {category.image ? (
                        <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <ImageIcon size={16} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 truncate">{category.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEditCategory(category); }} className="p-1 text-primary-600 hover:text-primary-800">
                      <Edit size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openDeleteModal(category._id); }} className="p-1 text-error-600 hover:text-error-800" disabled={isDeletingCategory}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{new Date(category.createdAt).toLocaleDateString()}</div>
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
            <h3 className="text-xl font-bold text-center mb-4">Delete Product Type</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this product type? This action cannot be undone and may affect products linked to it.
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={closeDeleteModal} className="btn btn-outline" disabled={isDeletingCategory}>
                Cancel
              </button>
              <button onClick={handleDeleteCategory} className="btn bg-error-500 text-white hover:bg-error-600" disabled={isDeletingCategory}>
                {isDeletingCategory ? (
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

export default AdminCategoriesPage;
