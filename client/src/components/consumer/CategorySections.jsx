import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGetAllCategoriesQuery } from '../../store/api/categoriesApi';
import CategorySection from './CategorySection';
import CategoryErrorBoundary from './CategoryErrorBoundary';

const CategorySections = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // Fetch all categories
  const { data: categories, isLoading, error } = useGetAllCategoriesQuery();

  // Select random categories - start with more to ensure we get 5 with products
  useEffect(() => {
    if (categories && categories.length > 0) {
      // Shuffle categories and take first 10 to ensure we have enough with products
      const shuffled = [...categories].sort(() => Math.random() - 0.5);
      setSelectedCategories(shuffled.slice(0, Math.min(10, categories.length)));
    }
  }, [categories]);

  // Loading state for categories
  if (isLoading) {
    return (
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('Error loading categories:', error);
    return (
      <div className="py-16 bg-red-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Categories
          </h2>
          <p className="text-red-500">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // No categories available
  if (!categories || categories.length === 0) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            No Categories Available
          </h2>
          <p className="text-gray-500">Please check back later</p>
        </div>
      </div>
    );
  }

  // No categories with products found
  if (selectedCategories.length === 0) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            No Categories with Products Available
          </h2>
          <p className="text-gray-500">Please check back later</p>
        </div>
      </div>
    );
  }

  // Render full CategorySection for categories with products
  // CategorySection will return null for categories with no products, which React will ignore
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {selectedCategories.map((category, index) => (
        <motion.div
          key={category._id || index}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
        >
          <CategoryErrorBoundary>
            <CategorySection category={category} />
          </CategoryErrorBoundary>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default CategorySections;
