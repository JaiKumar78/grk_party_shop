// src/components/Navbar.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxhooks.js';
import { logout } from '../../store/slices/userAuthSlice';
import { toggleMobileMenu } from '../../store/slices/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Shop", path: "/products" },
  { label: "Categories", path: "/categories" },
  { label: "About", path: "/about" },
];

const profileLinks = [
  { label: 'Profile', path: '/profile' },
];

const Navbar = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null); // Ref for the user menu dropdown

  const { isMobileMenuOpen } = useAppSelector((state) => state.ui);
  const { isAuthenticated } = useAppSelector((state) => state.userAuth);
  const cartItemsCount = useAppSelector((state) => state.cart.totalQuantity); // Get totalQuantity from cart slice

  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effect to close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/')
    setIsUserMenuOpen(false); // Close menu after logout
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${isScrolled ? 'bg-white shadow-md py-2' : 'lg:bg-transparent bg-white py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-pink-600">
            GRK Party Shop
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `font-medium transition-colors ${
                    isActive ? "text-pink-600" : "hover:text-pink-600"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <Link to="/products" aria-label="Search" className="hover:text-pink-600 transition-colors">
              <Search size={20} />
            </Link>

            {/* User Profile Menu */}
            <div
              className="relative"
              ref={userMenuRef} // Attached ref to the container
            >
              <button
                className="hover:text-primary-600 transition-colors"
                onClick={() => setIsUserMenuOpen((prev) => (!prev))}
                aria-haspopup="true" // Accessibility: indicates a popup menu
                aria-expanded={isUserMenuOpen} // Accessibility: indicates whether the popup is currently expanded
              >
                <User size={20} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-100 shadow-md rounded-md z-50 py-2">
                  {isAuthenticated ? (
                    <>
                      {profileLinks.map(link => (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          className={({ isActive }) =>
                            `block px-4 py-2 text-sm font-medium ${
                              isActive ? 'text-primary-600' : 'text-gray-800 hover:text-primary-600'
                            }`
                          }
                          onClick={() => setIsUserMenuOpen(false)} // Close menu on navigation
                        >
                          {link.label}
                        </NavLink>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-gray-800 hover:text-primary-600"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        navigate('/login');
                        setIsUserMenuOpen(false); // Close menu on navigation
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-gray-800 hover:text-primary-600"
                    >
                      Login
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Shopping Cart Icon */}
            <Link to="/cart" className="relative hover:text-pink-600 transition-colors">
              <ShoppingBag size={20} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              aria-label="Toggle menu"
              onClick={() => dispatch(toggleMobileMenu())}
              className="md:hidden hover:text-pink-600 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: {
                  opacity: 1,
                  height: "auto",
                  y: 0,
                  transition: {
                    opacity: { duration: 0.25, ease: "easeOut" },
                    height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                    y: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
                  }
                },
                closed: {
                  opacity: 0,
                  height: 0,
                  y: -20,
                  transition: {
                    opacity: { duration: 0.2, ease: "easeIn" },
                    height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
                    y: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
                  }
                }
              }}
              style={{ overflow: "hidden" }}
              className="md:hidden mt-4 border-t border-gray-100 bg-white shadow-lg rounded-b-xl"
            >
              <div className="flex flex-col space-y-3 py-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `font-medium transition-colors ${
                        isActive ? "text-pink-600" : "hover:text-pink-600"
                      }`
                    }
                    onClick={() => dispatch(toggleMobileMenu())}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
