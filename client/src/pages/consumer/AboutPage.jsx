import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Star, 
  Users, 
  Award, 
  ShoppingBag, 
  Truck, 
  Shield, 
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Gift,
  Calendar
} from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: Users, value: '10K+', label: 'Happy Customers' },
    { icon: ShoppingBag, value: '500+', label: 'Products' },
    { icon: Award, value: '5+', label: 'Years Experience' },
    { icon: Star, value: '4.9', label: 'Customer Rating' }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We prioritize your satisfaction above everything else, ensuring every interaction exceeds expectations.'
    },
    {
      icon: Shield,
      title: 'Quality Assured',
      description: 'Every product in our collection meets the highest standards of quality and craftsmanship.'
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery to make sure your special moments are never delayed.'
    },
    {
      icon: Sparkles,
      title: 'Unique Designs',
      description: 'Curated collections that stand out and make your celebrations truly memorable.'
    }
  ];

  const team = [
    {
      name: 'Priya Sharma',
      role: 'Founder & CEO',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      bio: 'Passionate about creating magical moments through exceptional party supplies.'
    },
    {
      name: 'Rajesh Kumar',
      role: 'Creative Director',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      bio: 'Bringing innovative designs and trends to make every celebration special.'
    },
    {
      name: 'Anjali Patel',
      role: 'Customer Success',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      bio: 'Ensuring every customer has an amazing experience with our products and service.'
    }
  ];

  const milestones = [
    { year: '2019', title: 'Founded', description: 'Started with a vision to make celebrations magical' },
    { year: '2020', title: 'First 1000 Customers', description: 'Reached our first major milestone' },
    { year: '2021', title: 'Expanded Collection', description: 'Added 200+ new products to our catalog' },
    { year: '2022', title: 'Online Platform', description: 'Launched our comprehensive e-commerce platform' },
    { year: '2023', title: '10K+ Customers', description: 'Served over 10,000 happy customers' },
    { year: '2024', title: 'Future Ready', description: 'Continuing to innovate and grow' }
  ];

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-8">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About GRK Party Shop
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're passionate about making every celebration extraordinary. From intimate gatherings to grand events, 
              we provide the perfect party supplies to create unforgettable memories.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Story Section */}
          <div className="bg-white rounded-3xl p-8 md:p-12 mb-20 shadow-xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Founded in 2019, GRK Party Shop began with a simple mission: to make every celebration magical. 
                    What started as a small local shop has grown into a trusted destination for party supplies across the region.
                  </p>
                  <p>
                    We believe that every moment deserves to be celebrated beautifully. Whether it's a birthday, wedding, 
                    corporate event, or any special occasion, we're here to provide you with the perfect supplies to make it unforgettable.
                  </p>
                  <p>
                    Our team of passionate individuals works tirelessly to curate the best products, ensure exceptional quality, 
                    and provide outstanding customer service. We're not just selling party supplies; we're helping you create memories.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Gift className="w-24 h-24 text-white" />
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl mb-4">
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${member.name}&background=pink&color=white&size=96`;
                      }}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-pink-600 font-semibold mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Our Journey</h2>
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-500"></div>
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="w-1/2 px-8">
                      <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="text-2xl font-bold text-pink-600 mb-2">{milestone.year}</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                        <p className="text-gray-600">{milestone.description}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full border-4 border-white shadow-lg"></div>
                    <div className="w-1/2 px-8"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Get in Touch</h2>
                <p className="text-xl text-white/90 mb-8">
                  Have questions or need help planning your next celebration? We'd love to hear from you!
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-3" />
                    <span>+91 81243 90011</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3" />
                    <span>grkpartyshop@gmail.com</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3" />
                    <span>Velachery, Chennai, Tamil Nadu, India</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-3" />
                    <span>Mon-Sun: 10AM - 9PM</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={() => navigate('/products')}
                  className="bg-white text-pink-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center mx-auto"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Start Shopping
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Follow Us</h3>
            <div className="flex justify-center space-x-6">
              {[
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  aria-label={social.label}
                >
                  <social.icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 