import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { name: 'Home', to: '/' },
    { name: 'Shop', to: '/products' },
    { name: 'Categories', to: '/categories' },
    { name: 'About Us', to: '/about' },
    { name: 'Contact', to: '/contact' },
  ];

  const customerLinks = [
    { name: 'Privacy Policy', to: '/privacy' },
    { name: 'Terms & Conditions', to: '/terms' },
    // { name: 'FAQ', to: '/faq' },
    { name: 'Returns & Refunds Policy', to: '/returns' },
    { name: 'Shipping Policy', to: '/shipping' },
  ];

  const socialIcons = [
    { icon: Facebook, href: '#' },
    { icon: Instagram, href: '#' },
    { icon: Twitter, href: '#' },
  ];

  const contactItems = [
    {
      icon: <MapPin size={18} className="text-pink-500 mr-2 mt-1 flex-shrink-0" />,
      text: 'Velachery, Chennai, Tamil Nadu 600042',
    },
    {
      icon: <Phone size={18} className="text-pink-500 mr-2 flex-shrink-0" />,
      text: '+91 81243 90011',
    },
    {
      icon: <Mail size={18} className="text-pink-500 mr-2 flex-shrink-0" />,
      text: 'grkpartyshop@gmail.com',
    },
  ];

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-pink-500 mb-4">GRK Party Shop</h3>
            <p className="text-gray-400 mb-4">
              Making celebrations unforgettable since 2018. Your one-stop shop for all party supplies.
            </p>
            <div className="flex space-x-4">
              {socialIcons.map(({ icon: Icon, href }, idx) => (
                <a key={idx} href={href} className="text-gray-400 hover:text-pink-500 transition-colors">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map(({ name, to }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 hover:text-pink-500 transition-colors">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              {customerLinks.map(({ name, to }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 hover:text-pink-500 transition-colors">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              {contactItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  {item.icon}
                  <span className="text-gray-400">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        {/* <div className="border-t border-gray-800 pt-8 pb-4">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="text-lg font-semibold mb-2">Subscribe to Our Newsletter</h4>
            <p className="text-gray-400 mb-4">Get updates on new products and special offers.</p>
            <form className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="px-4 py-2 rounded-full flex-grow bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-pink-500"
              />
              <button 
                type="submit" 
                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-medium transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div> */}

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} PartyPop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;