import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAllCategoriesQuery } from '../../store/api/categoriesApi';
import { useGetAllEventsQuery } from '../../store/api/eventsApi';
import { 
  Gift, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  Star,
  ShoppingBag,
  Heart,
  Users,
  Clock,
  MapPin
} from 'lucide-react';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useGetAllCategoriesQuery();
  const { data: events, isLoading: isLoadingEvents, error: eventsError } = useGetAllEventsQuery();

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${category.slug}`);
  };

  const handleEventClick = (event) => {
    navigate(`/products?event=${event.slug}`);
  };

  if (isLoadingCategories || isLoadingEvents) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 animate-spin border-4 border-pink-200 border-t-pink-600 rounded-full"></div>
              <p className="text-lg text-gray-700">Discovering amazing categories and events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Discover Our Collections
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our curated categories and special event collections to find the perfect items for every occasion
            </p>
          </div>

          {/* Categories Section */}
          <div className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Gift className="w-6 h-6 text-pink-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Product Categories</h2>
              </div>
              <div className="hidden md:block">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {categories?.length || 0} categories
                </span>
              </div>
            </div>

            {/* Bento Box Grid for Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories?.map((category, index) => (
                <div
                  key={category._id}
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
                    ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}
                    ${index === 3 ? 'lg:col-span-2' : ''}
                    ${index === 6 ? 'md:col-span-2' : ''}
                  `}
                >
                  {/* Background Image or Gradient */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br 
                    ${index % 4 === 0 ? 'from-pink-400 to-rose-500' : ''}
                    ${index % 4 === 1 ? 'from-purple-400 to-indigo-500' : ''}
                    ${index % 4 === 2 ? 'from-blue-400 to-cyan-500' : ''}
                    ${index % 4 === 3 ? 'from-emerald-400 to-teal-500' : ''}
                    opacity-90 group-hover:opacity-100 transition-opacity duration-300
                  `} />
                  
                  {/* Content */}
                  <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors">
                        {category.name}
                      </h3>
                      
                      {category.description && (
                        <p className="text-white/90 text-sm leading-relaxed mb-4">
                          {category.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Section */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-300" />
                        <span className="text-sm font-medium">Featured</span>
                      </div>
                      <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                        Explore
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Events Section */}
          <div className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Event Collections</h2>
              </div>
              <div className="hidden md:block">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {events?.length || 0} events
                </span>
              </div>
            </div>

            {/* Bento Box Grid for Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events?.map((event, index) => (
                <div
                  key={event._id}
                  onClick={() => handleEventClick(event)}
                  className={`
                    group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
                    ${index === 0 ? 'lg:col-span-2' : ''}
                    ${index === 3 ? 'md:col-span-2' : ''}
                  `}
                >
                  {/* Background Image or Gradient */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br 
                    ${index % 5 === 0 ? 'from-rose-400 to-pink-500' : ''}
                    ${index % 5 === 1 ? 'from-indigo-400 to-purple-500' : ''}
                    ${index % 5 === 2 ? 'from-cyan-400 to-blue-500' : ''}
                    ${index % 5 === 3 ? 'from-teal-400 to-emerald-500' : ''}
                    ${index % 5 === 4 ? 'from-orange-400 to-red-500' : ''}
                    opacity-90 group-hover:opacity-100 transition-opacity duration-300
                  `} />
                  
                  {/* Content */}
                  <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Heart className="w-6 h-6" />
                        </div>
                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors">
                        {event.name}
                      </h3>
                      
                      {event.description && (
                        <p className="text-white/90 text-sm leading-relaxed mb-4">
                          {event.description}
                        </p>
                      )}

                      {/* Event Details */}
                      <div className="space-y-2 mb-4">
                        {event.date && (
                          <div className="flex items-center text-white/80 text-sm">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center text-white/80 text-sm">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-white/80" />
                        <span className="text-sm font-medium">Special Collection</span>
                      </div>
                      <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                        View Items
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="text-center bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl p-12 text-white">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold mb-4">
                Can't Find What You're Looking For?
              </h3>
              <p className="text-xl text-white/90 mb-8">
                Our team is here to help you find the perfect items for your special occasions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/products')}
                  className="bg-white text-pink-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Browse All Products
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-pink-600 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage; 