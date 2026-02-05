import Hero from '../../components/consumer/Hero';
import CategorySections from '../../components/consumer/CategorySections';
import EventCollections from '../../components/consumer/EventCollections';
import NewArrivals from '../../components/consumer/NewArrivals';
import BestSellers from '../../components/consumer/BestSellers';
// import CategorySection from '../components/CategorySection';
import { Sparkles, Truck, CreditCard, LifeBuoy } from 'lucide-react';

const HomePage = () => {
  return (
    <div>
      <Hero
        title="Your Ultimate Party Destination"
        highlightWord="Starts Here"
        description="Find everything you need to create joyful and memorable moments, from balloons to decorations and more!"
        primaryButtonText="Explore Products"
        primaryButtonLink="/products"
        secondaryButtonText="Find Inspiration"
        secondaryButtonLink="/blog" // Example of another link
        featureText="Enjoy express delivery on all orders!"
      />

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="bg-pink-100 p-3 rounded-full mb-4">
                <Sparkles className="text-pink-600" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Handpicked supplies that make your celebrations special.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="bg-purple-100 p-3 rounded-full mb-4">
                <Truck className="text-purple-600" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Free shipping on orders over ₹50. Quick delivery to your door.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="bg-yellow-100 p-3 rounded-full mb-4">
                <CreditCard className="text-yellow-600" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Secure Payment</h3>
              <p className="text-gray-600">
                Multiple secure payment options for your convenience.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <LifeBuoy className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Customer Support</h3>
              <p className="text-gray-600">
                Friendly support team to help with any questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Collections Section */}
      <EventCollections />

      {/* New Arrivals Section */}
      <NewArrivals />

      {/* Best Sellers Section */}
      <BestSellers />

      {/* Dynamic Category Sections */}
      <CategorySections />

      {/* Inspirational Quote Section */}
      <section className="-mt-6 md:-mt-8 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-white/70 shadow-lg backdrop-blur">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-pink-200/40 blur-3xl"></div>
            <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-purple-200/40 blur-3xl"></div>

            <div className="relative px-6 py-14 md:px-12 md:py-16">
              <div className="mx-auto max-w-4xl text-center">
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/70 ring-1 ring-pink-100">
                  <span className="text-3xl leading-none text-pink-500">“</span>
                </div>
                <blockquote className="text-xl md:text-3xl leading-relaxed text-gray-800 italic">
                  In a world of moments, we help you create memories. Because every celebration, big or small, deserves to be wrapped in a little bit of beautiful.
                </blockquote>
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <span className="h-px w-10 bg-gradient-to-r from-transparent via-pink-300 to-transparent" />
                  <span>GRK Party Shop</span>
                  <span className="h-px w-10 bg-gradient-to-r from-transparent via-pink-300 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews Section */}
      {/* <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-500 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Love Our Products?</h2>
            <p className="max-w-2xl mx-auto mb-8">
              Share your experience and help others discover amazing party supplies!
            </p>
            
            Google Review Button
            <a
              href="https://g.page/r/your-business-name/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Write a Google Review
            </a>
          </div>

          Review Stats
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">4.8</div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="text-white/80">Average Rating</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <p className="text-white/80">Happy Customers</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">98%</div>
              <p className="text-white/80">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section> */}

    </div>
  );
};

export default HomePage;