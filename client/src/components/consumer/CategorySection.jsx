import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { useGetProductsQuery } from '../../store/api/productsApi';

const CategorySection = ({ category }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef(null);

  // Safety check
  if (!category || !category._id) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            Invalid Category
          </h2>
          <p className="text-gray-500">This category could not be loaded.</p>
        </div>
      </section>
    );
  }

  // Check if mobile on mount and resize
  useEffect(() => {
    try {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    } catch (error) {
      console.error('Error in mobile check:', error);
    }
  }, []);

  // Fetch products for this category
  const { data: productsData, isLoading, error } = useGetProductsQuery({
    productType: category._id,
    sortBy: 'newest'
  });

  // Normalize API responses that may be arrays or { products: [...] }
  const products = Array.isArray(productsData)
    ? productsData
    : (productsData?.products || productsData?.data || []);
  const displayProducts = products.slice(0, 5); // Show only 5 products
  
  // Calculate total slides for carousel functionality
  const totalSlides = Math.max(displayProducts.length, 1);
  
  // Determine if we should show fallback message
  const shouldShowFallback = false; // Set to true if you want to show fallback message

  // Define final products for display
  const finalProducts = displayProducts;

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && isMobile && finalProducts.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.max(totalSlides, 1));
      }, 1500);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, isMobile, finalProducts.length, totalSlides]);

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
          </div>
          <div className="text-center text-gray-500">Loading products for {category?.name ?? 'items'}...</div>
        </div>
      </section>
    );
  }

  // No products found - return null to hide this category section
  if (displayProducts.length === 0 && !isLoading) {
    return null;
  }


  const safeCategoryName = (category?.name ?? 'Items').toString();
  const safeCategoryLower = safeCategoryName.toLowerCase();

  return (
    <motion.section 
      className="py-16 bg-white"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4">
        {/* Category Title */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {safeCategoryName}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {category.description || `Discover amazing ${safeCategoryLower} for your celebrations`}
          </p>
          {shouldShowFallback && (
            <p className="text-sm text-orange-600 mt-2">
              Showing featured products (category-specific products coming soon)
            </p>
          )}
        </motion.div>

        {/* Products Display */}
        {isMobile && finalProducts.length > 2 ? (
          // Mobile Carousel
          <div className="relative">
            <div className="overflow-hidden">
              <motion.div 
                className="flex gap-4"
                animate={{ x: -currentSlide * (100 / 2) + '%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {finalProducts.map((product, index) => (
                  <motion.div
                    key={product._id}
                    className="w-1/2 flex-shrink-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            {/* Carousel Controls */}
            {finalProducts.length > 2 && (
              <div className="flex justify-center items-center mt-6 gap-4">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-600 transition-colors"
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.ceil(finalProducts.length / 2) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentSlide === index ? 'bg-pink-600' : 'bg-pink-200'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-600 transition-colors"
                  disabled={currentSlide >= Math.ceil(finalProducts.length / 2) - 1}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          // Desktop Grid
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {finalProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View Products Button */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            to={`/products?category=${category.slug || category._id}`}
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            View All {category.name}
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default CategorySection;
