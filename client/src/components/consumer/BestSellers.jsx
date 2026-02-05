import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { useGetProductsQuery } from '../../store/api/productsApi';
import ProductCard from './ProductCard';

const BestSellers = () => {
  const { data: allProducts, isLoading: areProductsLoading } = useGetProductsQuery();

  // Get best sellers (products with highest sales or featured products)
  const bestSellers = allProducts ? allProducts
    .filter(product => product.isFeatured && product.stock > 0)
    .slice(0, 8) : [];

  if (areProductsLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Star className="text-yellow-500 mr-2" size={24} />
              <h2 className="text-3xl font-bold text-gray-800">Best Sellers</h2>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our most popular products loved by customers. These party essentials are always in high demand.
            </p>
          </div>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Star className="text-yellow-500 mr-2" size={24} />
            <h2 className="text-3xl font-bold text-gray-800">Best Sellers</h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our most popular products loved by customers. These party essentials are always in high demand.
          </p>
        </div>

        {bestSellers.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {bestSellers.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative h-full"
                >
                  <div className="absolute top-2 left-2 z-10 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    Popular
                  </div>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <Link
                to="/products?isFeatured=true"
                className="inline-flex items-center bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                View All Best Sellers
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No best sellers available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default BestSellers; 