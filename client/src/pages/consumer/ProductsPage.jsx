import React, { useState, useEffect, useRef } from 'react';
import ProductCard from '../../components/consumer/ProductCard';
import { Search, SlidersHorizontal, X, ChevronDown, Filter } from 'lucide-react';
import { useGetProductsQuery } from '../../store/api/productsApi';
import { useGetAllCategoriesQuery } from '../../store/api/categoriesApi';
import { useGetAllEventsQuery } from '../../store/api/eventsApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const ProductsPage = () => {
    const location = useLocation();
    // State for filter and sort parameters
    const [productTypeFilter, setProductTypeFilter] = useState('all');
    const [eventFilter, setEventFilter] = useState('all');
    const [isFeaturedFilter, setIsFeaturedFilter] = useState('all'); // NEW: State for isFeatured filter
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const PRODUCTS_PER_PAGE_BASE = 15; // Constant for base products per page

    // State for mobile filter sidebar visibility
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // States for custom dropdown visibility
    const [isProductTypeDropdownOpen, setIsProductTypeDropdownOpen] = useState(true);
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(true);
    const [isFeaturedDropdownOpen, setIsFeaturedDropdownOpen] = useState(true); // NEW: Dropdown state for Is Featured
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(true);

    // Refs for click-outside functionality
    const productTypeDropdownRef = useRef(null);
    const eventDropdownRef = useRef(null);
    const isFeaturedDropdownRef = useRef(null); // NEW: Ref for Is Featured dropdown
    const sortDropdownRef = useRef(null);

    // Consolidated query parameters for RTK Query
    const queryParams = React.useMemo(() => ({
        productType: productTypeFilter === 'all' ? undefined : productTypeFilter,
        event: eventFilter === 'all' ? undefined : eventFilter,
        // NEW: Convert 'all', 'true', 'false' string to boolean or undefined
        isFeatured: isFeaturedFilter === 'all' ? undefined : (isFeaturedFilter === 'true'),
        searchTerm: searchTerm,
        sortBy: sortBy,
    }), [productTypeFilter, eventFilter, isFeaturedFilter, searchTerm, sortBy]); // NEW: Add isFeaturedFilter dependency

    // Fetch products based on filter/sort parameters
    const {
        data: products,
        isLoading: areProductsLoading,
        isFetching: areProductsFetching,
        isError: isProductsError,
        error: productsError,
    } = useGetProductsQuery(queryParams);

    // Fetch all categories (product types)
    const {
        data: categories,
        isLoading: areCategoriesLoading,
        isError: isCategoriesError,
        error: categoriesError,
    } = useGetAllCategoriesQuery();

    // Fetch all events
    const {
        data: events,
        isLoading: areEventsLoading,
        isError: isEventsError,
        error: eventsError,
    } = useGetAllEventsQuery();

    // On mount, check for query params and set filters accordingly
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        
        // Handle isFeatured parameter
        const isFeaturedParam = params.get('isFeatured');
        if (isFeaturedParam === 'true' || isFeaturedParam === 'false') {
            setIsFeaturedFilter(isFeaturedParam);
        }
        
        // Handle category parameter from Categories page
        const categoryParam = params.get('category');
        if (categoryParam) {
            console.log('Setting category filter:', categoryParam);
            setProductTypeFilter(categoryParam);
        }
        
        // Handle event parameter from Categories page
        const eventParam = params.get('event');
        if (eventParam) {
            console.log('Setting event filter:', eventParam);
            setEventFilter(eventParam);
        }
    }, [location.search]);

    // Scroll to top on mount and when filters/pagination change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPage, productTypeFilter, eventFilter, isFeaturedFilter, searchTerm, sortBy]);

    // Effect to handle scroll lock when mobile filters are open
    useEffect(() => {
        if (isMobileFiltersOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to ensure scroll is restored when component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileFiltersOpen]);

    // Note: Dropdown visibility is controlled only by each dropdown's toggle button

    // Handlers for filter/sort changes (now for custom dropdowns)
    const handleProductTypeChange = (id) => {
        setProductTypeFilter(id);
        setCurrentPage(1); // Reset to first page on filter change
        // setIsProductTypeDropdownOpen(false); // Close dropdown after selection
    };

    const handleEventChange = (id) => {
        setEventFilter(id);
        setCurrentPage(1); // Reset to first page on filter change
        // setIsEventDropdownOpen(false); // Close dropdown after selection
    };

    // NEW: Handler for Is Featured filter
    const handleIsFeaturedSelect = (value) => {
        setIsFeaturedFilter(value);
        setCurrentPage(1); // Reset to first page on filter change
        // setIsFeaturedDropdownOpen(false); // Close dropdown after selection
    };

    const handleSortSelect = (value) => {
        setSortBy(value);
        setCurrentPage(1); // Reset to first page on sort change
        // setIsSortDropdownOpen(false); // Close dropdown after selection
    };

    // Search term change handler, resets page
    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search change
    };

    // Clear all filters function
    const handleClearAllFilters = () => {
        setProductTypeFilter('all');
        setEventFilter('all');
        setIsFeaturedFilter('all'); // NEW: Reset isFeatured filter
        setSearchTerm('');
        setSortBy('newest');
        setCurrentPage(1); // Always reset to first page
        // Don't change dropdown states - keep them as they are
        if (isMobileFiltersOpen) setIsMobileFiltersOpen(false); // Close sidebar
    };

    // Check if any filters are active to show the clear button
    const areFiltersActive = React.useMemo(() => {
        return (
            productTypeFilter !== 'all' ||
            eventFilter !== 'all' ||
            isFeaturedFilter !== 'all' || // NEW: Include in active check
            searchTerm !== '' ||
            sortBy !== 'newest'
        );
    }, [productTypeFilter, eventFilter, isFeaturedFilter, searchTerm, sortBy]); // NEW: Add isFeaturedFilter dependency

    // Animation variants for mobile filter sidebar
    const mobileFilterVariants = {
        hidden: { x: '-100%' },
        visible: { x: '0%', transition: { type: 'tween', duration: 0.3 } },
        exit: { x: '-100%', transition: { type: 'tween', duration: 0.3 } },
    };

    // Helper functions to get display names for selected options
    const getProductTypeDisplayName = (id) => {
        if (id === 'all') return 'All Products';
        // Handle both ObjectId and slug formats
        const selected = categories?.find(cat => cat._id === id || cat.slug === id);
        return selected ? selected.name : 'All Products';
    };

    const getEventDisplayName = (id) => {
        if (id === 'all') return 'All Events';
        // Handle both ObjectId and slug formats
        const selected = events?.find(evt => evt._id === id || evt.slug === id);
        return selected ? selected.name : 'All Events';
    };

    // NEW: Helper for Is Featured display name
    const getIsFeaturedDisplayName = (value) => {
        switch (value) {
            case 'true': return 'Featured Only';
            case 'false': return 'Not Featured';
            default: return 'All';
        }
    };

    const getSortByDisplayName = (value) => {
        switch (value) {
            case 'newest': return 'Newest First';
            case 'name-asc': return 'Name (A-Z)';
            case 'name-desc': return 'Name (Z-A)';
            case 'price-low-high': return 'Price: Low to High';
            case 'price-high-low': return 'Price: High to Low';
            case 'oldest': return 'Oldest First';
            default: return 'Newest First';
        }
    };

    // Pagination Logic
    const totalProducts = products ? products.length : 0;
    let actualProductsPerPage;
    let totalPages;

    // Apply specific rule: "if total products retrieved are a few more than 15 lets say 17 show them in a single page"
    if (totalProducts > 0 && totalProducts <= 17) {
        actualProductsPerPage = totalProducts; // Show all on one page
        totalPages = 1;
    } else {
        actualProductsPerPage = PRODUCTS_PER_PAGE_BASE;
        totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE_BASE);
    }

    const indexOfLastProduct = currentPage * actualProductsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - actualProductsPerPage;
    const currentProducts = products ? products.slice(indexOfFirstProduct, indexOfLastProduct) : [];

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            paginate(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            paginate(currentPage - 1);
        }
    };

    return (
        <div className="pt-24 pb-16 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop Our Party Supplies</h1>
                <p className="text-gray-600 mb-8">
                    Find everything you need for your next celebration.
                </p>

                {/* Active Filter Banner */}
                {(productTypeFilter !== 'all' || eventFilter !== 'all') && (
                    <div className="mb-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <span className="font-semibold">Active Filters:</span>
                                {productTypeFilter !== 'all' && (
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                        Category: {getProductTypeDisplayName(productTypeFilter)}
                                    </span>
                                )}
                                {eventFilter !== 'all' && (
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                        Event: {getEventDisplayName(eventFilter)}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleClearAllFilters}
                                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-8 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        placeholder="Search products by name or description..."
                        className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                </div>

                <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                    {/* Mobile Filter Toggle */}
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm"
                        >
                            <SlidersHorizontal size={18} />
                            <span>Filters & Categories</span>
                        </button>
                    </div>

                    {/* Sidebar Filters (Desktop & Mobile Overlay) */}
                    <AnimatePresence>
                        {(isMobileFiltersOpen || window.innerWidth >= 1024) && (
                            <motion.div
                                className={`lg:col-span-1 fixed lg:static inset-y-0 left-0 w-64 lg:w-auto bg-white rounded-lg shadow-xl lg:shadow-md p-6 z-50 lg:z-auto overflow-y-auto ${!isMobileFiltersOpen ? 'hidden lg:block' : ''}`}
                                variants={mobileFilterVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Close button for mobile */}
                                {isMobileFiltersOpen && (
                                    <button
                                        onClick={() => setIsMobileFiltersOpen(false)}
                                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 lg:hidden"
                                    >
                                        <X size={24} />
                                    </button>
                                )}

                                {/* Filters Header with Clear Button */}
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                                    {areFiltersActive && (
                                        <button
                                            onClick={handleClearAllFilters}
                                            className='btn btn-primary'
                                        >
                                            <Filter size={18} className="mr-2" />Clear All
                                        </button>
                                    )}
                                </div>

                                {/* Product Type Filter (Custom Dropdown) */}
                                <div className="mb-6" ref={productTypeDropdownRef}>
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">Product Types</h2>
                                    <button
                                        type="button"
                                        className={` appearance-none w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white pr-10 flex justify-between items-center ${productTypeFilter === 'all' ? 'text-gray-500' : 'text-gray-800'}`}
                                        onClick={() => setIsProductTypeDropdownOpen(!isProductTypeDropdownOpen)}
                                    >
                                        <span>{getProductTypeDisplayName(productTypeFilter)}</span>
                                        <ChevronDown size={18} className={`transform transition-transform ${isProductTypeDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isProductTypeDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="relative w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1"
                                            >
                                                <ul className="max-h-60 overflow-y-auto py-1">
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${productTypeFilter === 'all' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleProductTypeChange('all')}
                                                    >
                                                        All Products
                                                    </li>
                                                    {areCategoriesLoading ? (
                                                        <li className="px-4 py-2 text-gray-500 italic">Loading product types...</li>
                                                    ) : isCategoriesError ? (
                                                        <li className="px-4 py-2 text-red-500">Error loading product types.</li>
                                                    ) : (
                                                        categories.length === 0 ? (
                                                            <li className="px-4 py-2 text-gray-500 italic">No Product Types available</li>
                                                        ) : (
                                                            categories.map((cat) => (
                                                                <li
                                                                    key={cat._id}
                                                                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${productTypeFilter === cat._id || productTypeFilter === cat.slug ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                                    onClick={() => handleProductTypeChange(cat._id)}
                                                                >
                                                                    {cat.name}
                                                                </li>
                                                            ))
                                                        )
                                                    )}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Events Filter (Custom Dropdown) */}
                                <div className="border-t border-gray-200 my-6 pt-6 mb-6" ref={eventDropdownRef}>
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">Events</h2>
                                    <button
                                        type="button"
                                        className={` appearance-none w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white pr-10 flex justify-between items-center ${eventFilter === 'all' ? 'text-gray-500' : 'text-gray-800'}`}
                                        onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                                    >
                                        <span>{getEventDisplayName(eventFilter)}</span>
                                        <ChevronDown size={18} className={`transform transition-transform ${isEventDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isEventDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="relative w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1"
                                            >
                                                <ul className="max-h-60 overflow-y-auto py-1">
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${eventFilter === 'all' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleEventChange('all')}
                                                    >
                                                        All Events
                                                    </li>
                                                    {areEventsLoading ? (
                                                        <li className="px-4 py-2 text-gray-500 italic">Loading events...</li>
                                                    ) : isEventsError ? (
                                                        <li className="px-4 py-2 text-red-500">Error loading events.</li>
                                                    ) : (
                                                        events?.length === 0 ? (
                                                            <li className="px-4 py-2 text-gray-500 italic">No Events available</li>
                                                        ) : (
                                                            events?.map((event) => (
                                                                <li
                                                                    key={event._id}
                                                                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${eventFilter === event._id || eventFilter === event.slug ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                                    onClick={() => handleEventChange(event._id)}
                                                                >
                                                                    {event.name}
                                                                </li>
                                                            ))
                                                        )
                                                    )}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* NEW: Is Featured Filter (Custom Dropdown) */}
                                <div className="border-t border-gray-200 my-6 pt-6 mb-6" ref={isFeaturedDropdownRef}>
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">Featured Products</h2>
                                    <button
                                        type="button"
                                        className={` appearance-none w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white pr-10 flex justify-between items-center ${isFeaturedFilter === 'all' ? 'text-gray-500' : 'text-gray-800'}`}
                                        onClick={() => setIsFeaturedDropdownOpen(!isFeaturedDropdownOpen)}
                                    >
                                        <span>{getIsFeaturedDisplayName(isFeaturedFilter)}</span>
                                        <ChevronDown size={18} className={`transform transition-transform ${isFeaturedDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isFeaturedDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="relative w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1"
                                            >
                                                <ul className="max-h-60 overflow-y-auto py-1">
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${isFeaturedFilter === 'all' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleIsFeaturedSelect('all')}
                                                    >
                                                        All
                                                    </li>
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${isFeaturedFilter === 'true' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleIsFeaturedSelect('true')}
                                                    >
                                                        Featured Only
                                                    </li>
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${isFeaturedFilter === 'false' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleIsFeaturedSelect('false')}
                                                    >
                                                        Not Featured
                                                    </li>
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>


                                {/* Sort By Section (Custom Dropdown) */}
                                <div className="border-t border-gray-200 my-6 pt-6" ref={sortDropdownRef}>
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">Sort By</h2>
                                    <button
                                        type="button"
                                        className={` appearance-none w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white pr-10 flex justify-between items-center ${sortBy === 'newest' ? 'text-gray-500' : 'text-gray-800'}`}
                                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                    >
                                        <span>{getSortByDisplayName(sortBy)}</span>
                                        <ChevronDown size={18} className={`transform transition-transform ${isSortDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isSortDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="relative w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1"
                                            >
                                                <ul className="max-h-60 overflow-y-auto py-1">
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'newest' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleSortSelect('newest')}
                                                    >
                                                        Newest First
                                                    </li>
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'oldest' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleSortSelect('oldest')}
                                                    >
                                                        Oldest First
                                                    </li>
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'name-asc' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleSortSelect('name-asc')}
                                                    >
                                                        Name (A-Z)
                                                    </li>
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'name-desc' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleSortSelect('name-desc')}
                                                    >
                                                        Name (Z-A)
                                                    </li>
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'price-low-high' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleSortSelect('price-low-high')}
                                                    >
                                                        Price: Low to High
                                                    </li>
                                                    <li
                                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'price-high-low' ? 'bg-pink-100 text-pink-800 font-medium' : 'text-gray-700'}`}
                                                        onClick={() => handleSortSelect('price-high-low')}
                                                    >
                                                        Price: High to Low
                                                    </li>
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Overlay for mobile filter sidebar */}
                    <AnimatePresence>
                        {isMobileFiltersOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="fixed inset-0 bg-opacity-50 z-30 lg:hidden"
                            />
                        )}
                    </AnimatePresence>


                    {/* Product Grid */}
                    <div className="lg:col-span-3">
                        {areProductsLoading || areProductsFetching ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                                <p className="ml-4 text-gray-600">Loading products...</p>
                            </div>
                        ) : isProductsError ? (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-center">
                                <strong className="font-bold">Error!</strong>
                                <span className="block sm:inline ml-2">{productsError.message || 'Failed to fetch products.'}</span>
                            </div>
                        ) : products?.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <h3 className="text-xl font-medium text-gray-800 mb-2">No products found</h3>
                                <p className="text-gray-600 mb-4">
                                    Try adjusting your search or filter criteria.
                                </p>
                                <button
                                    onClick={handleClearAllFilters}
                                    className='btn btn-primary'
                                >
                                    <Filter size={18} className="mr-2" />Clear all filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 flex justify-between items-center">
                                    <p className="text-gray-600">
                                        Showing {currentProducts.length} of {totalProducts} product{totalProducts !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {currentProducts.map((product) => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center mt-8 space-x-2">
                                        <button
                                            onClick={handlePrevPage}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 bg-white rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        {[...Array(totalPages)].map((_, index) => (
                                            <button
                                                key={index + 1}
                                                onClick={() => paginate(index + 1)}
                                                className={`px-4 py-2 rounded-md ${
                                                    currentPage === index + 1
                                                        ? 'bg-pink-600 text-white'
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 bg-white rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;
