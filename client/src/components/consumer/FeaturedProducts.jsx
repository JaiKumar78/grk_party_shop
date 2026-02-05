import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard'; // Ensure ProductCard.jsx is in the same directory or adjust path
import { useGetProductsQuery } from '../../store/api/productsApi'; // Assuming you have productsApi setup for RTK Query
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'; // Icons for slider navigation
import { motion, AnimatePresence } from 'framer-motion'; // For smooth slider animations

const FeaturedProducts = () => {
  // Fetch all products using RTK Query.
  // This query should be configured in your productsApi to return products
  // with populated categories (productType and eventType).
  const { data: products, isLoading, isError } = useGetProductsQuery();

  const [currentIndex, setCurrentIndex] = useState(0); // State to track the current slide index
  const sliderRef = useRef(null); // Ref to the slider container for potential DOM measurements
  const [cardsPerPage, setCardsPerPage] = useState(4); // Default number of cards visible per page on large screens

  // Memoize the filtering and slicing of featured products for performance.
  // It filters for 'isFeatured' and then takes up to the first 10 products.
  const featuredProducts = React.useMemo(() => {
    if (!products) return [];
    return products.filter(product => product.isFeatured && product.stock > 0).slice(0, 10);
  }, [products]); // Re-calculate only when 'products' data changes

  // Effect to dynamically adjust the number of cards shown per page based on screen size.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // Large screens (lg breakpoint)
        setCardsPerPage(4);
      } else if (window.innerWidth >= 768) { // Medium screens (md breakpoint)
        setCardsPerPage(3);
      } else if (window.innerWidth >= 640) { // Small screens (sm breakpoint)
        setCardsPerPage(2);
      } else { // Extra small screens (default)
        setCardsPerPage(1);
      }
    };

    window.addEventListener('resize', handleResize); // Add resize listener
    handleResize(); // Call once to set initial value on component mount

    return () => window.removeEventListener('resize', handleResize); // Clean up listener
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Calculate the total number of "slides" or pages needed for the carousel
  // based on the number of featured products and how many cards are shown per page.
  const totalSlides = Math.ceil(featuredProducts.length / cardsPerPage);

  // Function to navigate to the next slide
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides); // Loop back to start after last slide
  };

  // Function to navigate to the previous slide
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides); // Loop to end from start
  };

  // --- Loading, Error, and No Products States ---
  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        <p className="ml-4 text-gray-600">Loading featured products...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-16 bg-gray-50 text-center text-red-600">
        <p>Error loading featured products. Please try again later.</p>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <section className="py-16 bg-gray-50 text-center text-gray-600">
        <h2 className="text-3xl font-bold mb-2">No Featured Products Available</h2>
        <p className="max-w-2xl mx-auto">
          Check back later for exciting new party essentials!
        </p>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Featured Products</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our most popular party essentials, carefully selected to make your celebration perfect.
          </p>
        </div>

        <div className="relative mb-12">
          {/* Slider Container: Handles the horizontal scrolling/animation */}
          <div className="overflow-hidden rounded-lg"> {/* Added rounded-lg to clip cards */}
            <motion.div
              ref={sliderRef}
              className="flex" // Flex container for all product cards
              // Animate X-position to create the slide effect
              animate={{ x: `-${currentIndex * (100 / cardsPerPage)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }} // Smooth animation
            >
              {featuredProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex-none px-4 py-2 h-full min-h-[420px] flex flex-col" // min-h for consistent card height, flex for stretch
                  style={{ width: `${100 / cardsPerPage}%` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Navigation Buttons (Previous/Next) */}
          {/* Only show buttons if there are more products than can fit on one page */}
          {featuredProducts.length > cardsPerPage && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 shadow-lg z-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                aria-label="Previous slide"
              >
                <ChevronLeft size={24} className="text-gray-800" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 shadow-lg z-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                aria-label="Next slide"
              >
                <ChevronRight size={24} className="text-gray-800" />
              </button>
            </>
          )}
        </div>

        {/* View All Products Button */}
        <div className="text-center">
          {/* Updated Link to pass isFeatured=true as a query parameter */}
          <Link
            to="/products?isFeatured=true"
            className="inline-flex items-center bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span>View All Products</span>
            <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
