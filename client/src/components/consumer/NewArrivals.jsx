import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useGetProductsQuery } from '../../store/api/productsApi';
import ProductCard from './ProductCard';

const NewArrivals = () => {
  const { data: products, isLoading: areProductsLoading } = useGetProductsQuery();

  if (areProductsLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">New Arrivals</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our latest additions to make your celebrations even more special.
            </p>
          </div>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </section>
    );
  }

  // Get the 8 most recently added products
  const newArrivals = products ? products.filter(product => product.stock > 0).slice(0, 8) : [];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="text-pink-500 mr-2" size={24} />
            <h2 className="text-3xl font-bold text-gray-800">New Arrivals</h2>
            <Sparkles className="text-pink-500 ml-2" size={24} />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our latest additions to make your celebrations even more special.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {newArrivals.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/products"
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

export default NewArrivals; 