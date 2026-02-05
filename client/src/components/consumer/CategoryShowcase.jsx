import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Gift } from 'lucide-react';
import { useGetAllCategoriesQuery } from '../../store/api/categoriesApi';

const CategoryShowcase = () => {
  const { data: categories, isLoading: areCategoriesLoading } = useGetAllCategoriesQuery();

  if (areCategoriesLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Shop by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find the perfect party supplies for any celebration. From balloons to tableware, we have everything you need.
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
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Shop by Category</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find the perfect party supplies for any celebration. From balloons to tableware, we have everything you need.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories?.slice(0, 8).map((category, index) => (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={`/products?category=${category.slug || category._id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-4 md:p-6 text-center group min-h-[220px] flex flex-col justify-between pb-4 h-56 md:h-72"
              >
                <div className="flex-1 min-h-0 flex flex-col justify-start">
                  {category.image ? (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden border-2 border-pink-200">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="object-cover w-full h-full rounded-full group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Gift className="text-white" size={28} />
                  </div>
                  )}
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors line-clamp-2">
                    {category.name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2 md:mb-4">
                    {category.description || 'Perfect party supplies for your celebration'}
                  </p>
                </div>
                <div className="flex items-center justify-center text-pink-600 group-hover:text-pink-700 transition-colors mt-2 md:mt-4">
                  <span className="text-xs md:text-sm font-medium">Explore</span>
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase; 