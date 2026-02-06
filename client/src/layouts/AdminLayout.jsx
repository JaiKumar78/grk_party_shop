import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu, // For mobile open button
  X,    // For mobile close button
  ChevronLeft, // For desktop expand/collapse
  ChevronRight, // For desktop expand/collapse
  ChevronDown,  // For submenu expand/collapse
  Boxes,
  CalendarDays,
  Store, // NEW: For Store icon
  Settings as SettingsIcon, // NEW: For Settings icon
} from 'lucide-react';
import { useAppDispatch } from '../hooks/reduxhooks';
import { logout } from '../store/slices/adminAuthSlice';
import { motion, AnimatePresence } from 'framer-motion';
import BackToTop from '../components/BackToTop';

const AdminLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true); // Controls desktop sidebar width
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false); // Controls mobile sidebar visibility/animation
  const [expandedItems, setExpandedItems] = useState({
    products: false,
    orders: false,
  });

  // Lock/unlock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  // Effect to close mobile sidebar if screen becomes desktop size
  useEffect(() => {
    const handleResize = () => {
      // If screen is 'md' or larger, ensure mobile sidebar is closed.
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array ensures this runs only on mount/unmount

  // NEW useEffect: Close mobile sidebar on navigation (e.g., when route changes)
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]); // Close whenever the route changes


  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  const toggleExpand = (item) => {
    setExpandedItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  // Helper function for NavLink onClick
  const handleNavLinkClick = () => {
    // Only close mobile sidebar if it's currently open
    if (isMobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };


  const sidebarItems = [
    {
      icon: <LayoutDashboard size={20} />,
      name: 'Dashboard',
      path: '/admin',
      exact: true,
    },
    {
      icon: <Package size={20} />,
      name: 'Products',
      path: '/admin/products',
      hasSubmenu: true,
      submenuItems: [
        { name: 'All Products', path: '/admin/products' },
        { name: 'Add New Product', path: '/admin/products/new' },
      ],
    },
    {
      icon: <Boxes size={20} />,
      name: 'Product Types',
      path: '/admin/categories',
    },
    {
      icon: <CalendarDays size={20} />,
      name: 'Events',
      path: '/admin/events',
    },
    {
      icon: <Store size={20} />, // NEW: Store Icon
      name: 'Stores', // NEW: Store Link
      path: '/admin/stores',
    },
    {
      icon: <ShoppingCart size={20} />,
      name: 'Orders',
      path: '/admin/orders',
      // Removed hasSubmenu and submenuItems
    },
    {
      icon: <SettingsIcon size={20} />, // You may need to import a settings icon
      name: 'Settings',
      path: '/admin/settings',
    },
  ];

  const renderSidebarContent = (isCollapsed) => (
    <>
      <div className="p-4 flex items-center border-gray-300 border-b">
        {isCollapsed ? ( // When collapsed, only show the toggle button, centered
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="text-gray-600 hover:text-primary-500 hidden md:block mx-auto" // mx-auto to center
          >
            {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        ) : ( // When not collapsed (expanded), show H1 and button justify-between
          <>
            <h1 className="text-primary-500 font-bold text-xl">Admin Panel</h1> {/* No flex-1 needed here */}
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 hover:text-primary-500 hidden md:block ml-auto" // ml-auto pushes to right
            >
              {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </button>
          </>
        )}
      </div>
      <nav className="p-4 flex-1 overflow-y-auto"> {/* Added overflow-y-auto to nav for internal scroll */}
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.name} className="mb-2">
              {item.hasSubmenu ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.name.toLowerCase())}
                    className={`flex items-center w-full p-2 rounded-md hover:bg-gray-100 ${
                      item.submenuItems.some(sub => location.pathname.includes(sub.path))
                        ? 'bg-primary-100 text-primary-600'
                        : 'text-gray-700'
                    }`}
                  >
                    <span className={`flex-shrink-0 flex items-center justify-center ${isCollapsed ? 'w-10' : 'w-auto mr-3'}`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && ( // Only show text and chevron if NOT collapsed
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {expandedItems[item.name.toLowerCase()] ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </>
                    )}
                  </button>
                  {!isCollapsed && expandedItems[item.name.toLowerCase()] && ( // Only show submenu if NOT collapsed and expanded
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-8 mt-1 space-y-1"
                    >
                      {item.submenuItems?.map((subitem) => (
                        <li key={subitem.name}>
                          <NavLink
                            onClick={handleNavLinkClick}
                            to={subitem.path}
                            className={({ isActive }) =>
                              `block p-2 rounded-md hover:bg-gray-100 ${
                                isActive
                                  ? 'bg-primary-100 text-primary-600'
                                  : 'text-gray-600'
                              }`
                            }
                          >
                            {subitem.name}
                          </NavLink>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </div>
              ) : (
                <NavLink
                  onClick={handleNavLinkClick}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-md hover:bg-gray-100 ${
                      isActive ? 'bg-primary-100 text-primary-600' : 'text-gray-700'
                    } ${isCollapsed ? 'justify-center' : ''}`
                  }
                >
                  <span className={`flex-shrink-0 flex items-center justify-center ${isCollapsed ? 'w-10' : 'w-auto mr-3'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.name}</span>} {/* Only show text if NOT collapsed */}
                </NavLink>
              )}
            </li>
          ))}
          <li>
            <button
              onClick={handleLogout}
              className={`flex items-center w-full p-2 rounded-md hover:bg-gray-100 text-gray-700 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <span className={`flex-shrink-0 flex items-center justify-center ${isCollapsed ? 'w-10' : 'w-auto mr-3'}`}>
                <LogOut size={20} />
              </span>
              {!isCollapsed && <span>Logout</span>} {/* Only show text if NOT collapsed */}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Sidebar Toggle Button (visible only on screens smaller than md) */}
      <div className="md:hidden bg-white p-4 flex items-center justify-between border-gray-300 border-b">
        <h1 className="text-primary-500 font-bold text-xl">GRK Party Shop</h1>
        <button
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          className="text-gray-600 hover:text-primary-500"
        >
          {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay (transparent, non-clickable) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-transparent z-30 md:hidden pointer-events-none"
          ></motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Always visible on md screens and up) */}
      <aside
        className={`
          bg-white shadow-md z-20 // Lower z-index for desktop sidebar
          hidden md:flex md:flex-col md:h-screen md:sticky md:top-0 md:flex-shrink-0
          ${isSidebarOpen ? 'md:w-64 md:pl-0 md:pr-0' : 'md:w-20 md:pl-0 md:pr-0'}
          transition-all duration-300 ease-in-out
        `}
      >
        {renderSidebarContent(!isSidebarOpen)} {/* Pass !isSidebarOpen for desktop */}
      </aside>

      {/* Mobile Sidebar (Animated overlay, only on smaller screens) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-y-0 left-0 w-64 h-screen bg-white shadow-md z-40 flex flex-col" // Higher z-index for mobile
          >
            {renderSidebarContent(false)} {/* Mobile sidebar is always "expanded" within its own view */}
          </motion.aside>
        )}
      </AnimatePresence>


      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default AdminLayout;
