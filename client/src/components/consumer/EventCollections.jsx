import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { useGetAllEventsQuery } from '../../store/api/eventsApi';

const EventCollections = () => {
  const { data: events, isLoading: areEventsLoading } = useGetAllEventsQuery();

  if (areEventsLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Celebrate Every Occasion</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From birthdays to weddings, we have curated collections for every special moment in your life.
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
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Celebrate Every Occasion</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From birthdays to weddings, we have curated collections for every special moment in your life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events?.slice(0, 6).map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={`/products?event=${event.slug || event._id}`}
                className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-8 text-center group border border-pink-100 h-80 flex flex-col justify-between"
              >
                <div>
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-pink-600 transition-colors line-clamp-2">
                    {event.name}
                  </h3>
                  <p className="text-gray-600 line-clamp-3">
                    {event.description || 'Make your celebration unforgettable with our curated collection'}
                  </p>
                </div>
                <div className="inline-flex items-center bg-white px-4 py-2 rounded-full text-pink-600 font-medium group-hover:bg-pink-600 group-hover:text-white transition-all duration-300 mt-6">
                  <span>Shop Collection</span>
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Categories Button */}
        <div className="text-center mt-12">
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            View All Categories
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventCollections; 