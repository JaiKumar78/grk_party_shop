import { useState, useEffect, useMemo, useRef } from 'react'; // Import useRef for click outside
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    useGetProductsQuery,
    useDeleteProductMutation,
} from '../../store/api/productsApi';
import { useGetAllCategoriesQuery } from '../../store/api/categoriesApi';
import { useGetAllEventsQuery } from '../../store/api/eventsApi';
import { motion } from 'framer-motion';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Filter,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ChevronDown, // For dropdown indicator
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminProductsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Refs for click-outside functionality
    const productTypeDropdownRef = useRef(null);
    const eventDropdownRef = useRef(null);
    const stockDropdownRef = useRef(null);
    const sortDropdownRef = useRef(null);

    // Initialize filter states from URL search parameters
    const initialSearchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const [searchTerm, setSearchTerm] = useState(initialSearchParams.get('search') || '');
    const [productTypeFilter, setProductTypeFilter] = useState(initialSearchParams.get('productType') || '');
    const [eventFilter, setEventFilter] = useState(initialSearchParams.get('event') || '');
    const [stockFilter, setStockFilter] = useState(initialSearchParams.get('stockStatus') || '');
    const [sortBy, setSortBy] = useState(initialSearchParams.get('sortBy') || 'newest');

    // State for controlling custom dropdown visibility
    const [isProductTypeDropdownOpen, setIsProductTypeDropdownOpen] = useState(false);
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);


    // Memoize query parameters to avoid unnecessary re-fetches
    // All filtering, sorting, and searching is handled by the backend
    const queryParams = useMemo(() => ({
        searchTerm: searchTerm,
        productType: productTypeFilter,
        event: eventFilter,
        stockStatus: stockFilter,
        sortBy: sortBy,
    }), [searchTerm, productTypeFilter, eventFilter, stockFilter, sortBy]);

    // LOG: Parameters being sent to useGetProductsQuery for debugging
    useEffect(() => {
        console.log("AdminProductsPage - Fetching products with params:", queryParams);
    }, [queryParams]);


    // Fetch products with dynamic query parameters
    const { data: products, isLoading, refetch, error: productsError } = useGetProductsQuery(queryParams);

    // Fetch categories
    const { data: categories, isLoading: areCategoriesLoading, error: categoriesError } = useGetAllCategoriesQuery();

    // Fetch events
    const { data: events, isLoading: areEventsLoading, error: eventsError } = useGetAllEventsQuery();

    // LOG: Raw categories data and any errors
    useEffect(() => {
        console.log("AdminProductsPage - Raw Categories Data received:", categories);
        if (categoriesError) {
            console.error("AdminProductsPage - Categories Fetch Error:", categoriesError);
        }
        console.log("AdminProductsPage - Raw Events Data received:", events);
        if (eventsError) {
            console.error("AdminProductsPage - Events Fetch Error:", eventsError);
        }
    }, [categories, categoriesError, events, eventsError]);


    const [deleteProduct] = useDeleteProductMutation();

    // productToDelete now stores the SLUG
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Effect for handling clicks outside dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (productTypeDropdownRef.current && !productTypeDropdownRef.current.contains(event.target)) {
                setIsProductTypeDropdownOpen(false);
            }
            if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
                setIsEventDropdownOpen(false);
            }
            if (stockDropdownRef.current && !stockDropdownRef.current.contains(event.target)) {
                setIsStockDropdownOpen(false);
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setIsSortDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Function to update URL search parameters whenever a filter/sort state changes
    const updateUrlParams = (newParams) => {
        const currentParams = new URLSearchParams(location.search);
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) {
                currentParams.set(key, value);
            } else {
                currentParams.delete(key);
            }
        });
        navigate(`?${currentParams.toString()}`, { replace: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        updateUrlParams({ search: searchTerm });
    };

    // Custom dropdown click handler for Product Type
    const handleProductTypeFilter = (typeId) => {
        setProductTypeFilter(typeId);
        updateUrlParams({ productType: typeId });
        setIsProductTypeDropdownOpen(false);
    };

    // Custom dropdown click handler for Event
    const handleEventFilter = (eventId) => {
        setEventFilter(eventId);
        updateUrlParams({ event: eventId });
        setIsEventDropdownOpen(false);
    };

    // Custom dropdown click handler for Stock
    const handleStockFilter = (filterValue) => {
        setStockFilter(filterValue);
        updateUrlParams({ stockStatus: filterValue });
        setIsStockDropdownOpen(false);
    };

    // Custom dropdown click handler for Sort
    const handleSortChange = (sort) => {
        setSortBy(sort);
        updateUrlParams({ sortBy: sort });
        setIsSortDropdownOpen(false);
    };

    // openDeleteModal now expects a SLUG
    const openDeleteModal = (slug) => {
        setProductToDelete(slug); // Store the slug
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setProductToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;

        setIsDeleting(true);
        try {
            // Call deleteProduct mutation with the stored slug
            await deleteProduct(productToDelete).unwrap();
            toast.success('Product deleted successfully');
        } catch (error) {
            toast.error('Failed to delete product');
            console.error("Delete error:", error);
        } finally {
            setIsDeleting(false);
            closeDeleteModal();
        }
    };

    const handleClearAllFilters = () => {
        setSearchTerm('');
        setProductTypeFilter('');
        setEventFilter('');
        setStockFilter('');
        setSortBy('newest');
        navigate(location.pathname, { replace: true });
    };

    const areFiltersActive = useMemo(() => {
        return (
            searchTerm !== '' ||
            productTypeFilter !== '' ||
            eventFilter !== '' ||
            stockFilter !== '' ||
            sortBy !== 'newest'
        );
    }, [searchTerm, productTypeFilter, eventFilter, stockFilter, sortBy]);


    const displayedProducts = products;
    const allDataLoading = isLoading || areCategoriesLoading || areEventsLoading;

    // Function to get display name for product type filter
    const getProductTypeDisplayName = (id) => {
        if (id === '') return 'All Product Types';
        const selected = categories?.find(cat => cat._id === id);
        return selected ? selected.name : 'Unknown Type';
    };

    // Function to get display name for event filter
    const getEventDisplayName = (id) => {
        if (id === '') return 'All Events';
        const selected = events?.find(evt => evt._id === id);
        return selected ? selected.name : 'Unknown Event';
    };

    // Function to get display name for stock status filter
    const getStockStatusDisplayName = (value) => {
        switch (value) {
            case 'inStock': return 'In Stock';
            case 'outOfStock': return 'Out of Stock';
            case 'lessThan10': return 'Low Stock (<= 10)';
            default: return 'All Stock Status';
        }
    };

    // Function to get display name for sort by filter
    const getSortByDisplayName = (value) => {
        switch (value) {
            case 'newest': return 'Newest First';
            case 'oldest': return 'Oldest First';
            case 'name-asc': return 'Name (A-Z)';
            case 'name-desc': return 'Name (Z-A)';
            case 'price-low-high': return 'Price (Low to High)';
            case 'price-high-low': return 'Price (High to Low)';
            case 'stock-low-high': return 'Stock (Low to High)';
            case 'stock-high-low': return 'Stock (High to Low)';
            case 'featured-first': return 'Featured First';
            case 'non-featured-first': return 'Non-Featured First';
            default: return 'Newest First';
        }
    };

    // Helper function to get price display for simple products
    const getSimpleProductPrice = (product) => {
        return `₹${product.price.toFixed(2)}`;
    };

    // Helper function to get price display for variant products
    const getVariantProductPrice = (product) => {
        const prices = product.variants.map(v => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return minPrice === maxPrice 
            ? `₹${minPrice.toFixed(2)}`
            : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`;
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Top Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Products</h1>
                    <p className="text-gray-600 text-sm md:text-base">Manage your product inventory</p>
                </div>
                <Link to="/admin/products/new" className="btn btn-primary flex items-center gap-2 px-4 py-2">
                    <Plus size={18} /> <span>Add New Product</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 md:p-7 mb-8 border border-gray-100">
                {/* Filters Header with Clear Button */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                    <div className="flex items-center gap-4">
                        {allDataLoading && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                                <span>Applying filters...</span>
                            </div>
                        )}
                        {areFiltersActive && (
                            <button
                                onClick={handleClearAllFilters}
                                className='btn btn-primary'
                                disabled={allDataLoading}
                            >
                                <Filter size={16} className="mr-1" /> Clear All Filters
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col flex-wrap md:flex-row gap-4 md:gap-5 mb-6">
                    {/* Search */}
                    <div className="w-full md:w-80 lg:w-96">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products by name or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input pr-14 w-full py-2.5"
                                    disabled={allDataLoading}
                                />
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 text-gray-400 hover:text-primary-500 hover:bg-gray-100 transition-colors"
                                    disabled={allDataLoading}
                                >
                                    <Search size={16} />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Product Type Filter (Custom Dropdown) */}
                    <div className="w-full md:w-64 relative" ref={productTypeDropdownRef}>
                        <button
                            type="button"
                            className={`input w-full flex justify-between items-center ${productTypeFilter ? 'text-gray-800' : 'text-gray-500'} ${allDataLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !allDataLoading && setIsProductTypeDropdownOpen(!isProductTypeDropdownOpen)}
                            disabled={allDataLoading}
                        >
                            <span>{getProductTypeDisplayName(productTypeFilter)}</span>
                            <ChevronDown size={18} className={`transform transition-transform ${isProductTypeDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                        {isProductTypeDropdownOpen && (
                            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                <ul className="max-h-60 overflow-y-auto py-1">
                                    <li
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                        onClick={() => handleProductTypeFilter('')}
                                    >
                                        All Product Types
                                    </li>
                                    {areCategoriesLoading ? (
                                        <li className="px-4 py-2 text-gray-500 italic">Loading product types...</li>
                                    ) : categoriesError ? (
                                        <li className="px-4 py-2 text-red-500">Error loading product types</li>
                                    ) : (
                                        categories?.length === 0 ? (
                                            <li className="px-4 py-2 text-gray-500 italic">No Product Types available</li>
                                        ) : (
                                            categories?.map((cat) => (
                                                <li
                                                    key={cat._id}
                                                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${productTypeFilter === cat._id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                                    onClick={() => handleProductTypeFilter(cat._id)}
                                                >
                                                    {cat.name}
                                                </li>
                                            ))
                                        )
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Event Filter (Custom Dropdown) */}
                    <div className="w-full md:w-64 relative" ref={eventDropdownRef}>
                        <button
                            type="button"
                            className={`input w-full flex justify-between items-center ${eventFilter ? 'text-gray-800' : 'text-gray-500'} ${allDataLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !allDataLoading && setIsEventDropdownOpen(!isEventDropdownOpen)}
                            disabled={allDataLoading}
                        >
                            <span>{eventFilter ? getEventDisplayName(eventFilter) : 'All Events'}</span>
                            <ChevronDown size={18} className={`transform transition-transform ${isEventDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                        {isEventDropdownOpen && (
                            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                <ul className="max-h-60 overflow-y-auto py-1">
                                    <li
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                        onClick={() => handleEventFilter('')}
                                    >
                                        All Events
                                    </li>
                                    {areEventsLoading ? (
                                        <li className="px-4 py-2 text-gray-500 italic">Loading events...</li>
                                    ) : eventsError ? (
                                        <li className="px-4 py-2 text-red-500">Error loading events</li>
                                    ) : (
                                        events?.length === 0 ? (
                                            <li className="px-4 py-2 text-gray-500 italic">No events available</li>
                                        ) : (
                                            events?.map((event) => (
                                                <li
                                                    key={event._id}
                                                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${eventFilter === event._id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                                    onClick={() => handleEventFilter(event._id)}
                                                >
                                                    {event.name}
                                                </li>
                                            ))
                                        )
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Stock Filter (Custom Dropdown) */}
                    <div className="w-full md:w-64 relative" ref={stockDropdownRef}>
                        <button
                            type="button"
                            className={`input w-full flex justify-between items-center ${stockFilter ? 'text-gray-800' : 'text-gray-500'} ${allDataLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !allDataLoading && setIsStockDropdownOpen(!isStockDropdownOpen)}
                            disabled={allDataLoading}
                        >
                            <span>{getStockStatusDisplayName(stockFilter)}</span>
                            <ChevronDown size={18} className={`transform transition-transform ${isStockDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                        {isStockDropdownOpen && (
                            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                <ul className="max-h-60 overflow-y-auto py-1">
                                    <li
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                        onClick={() => handleStockFilter('')}
                                    >
                                        All Stock Status
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${stockFilter === 'inStock' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleStockFilter('inStock')}
                                    >
                                        In Stock
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${stockFilter === 'outOfStock' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleStockFilter('outOfStock')}
                                    >
                                        Out of Stock
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${stockFilter === 'lessThan10' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleStockFilter('lessThan10')}
                                    >
                                        Stock &lt;=  10
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Sort (Custom Dropdown) */}
                    <div className="w-full md:w-64 relative" ref={sortDropdownRef}>
                        <button
                            type="button"
                            className={`input w-full flex justify-between items-center ${sortBy ? 'text-gray-800' : 'text-gray-500'} ${allDataLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !allDataLoading && setIsSortDropdownOpen(!isSortDropdownOpen)}
                            disabled={allDataLoading}
                        >
                            <span>{getSortByDisplayName(sortBy)}</span>
                            <ChevronDown size={18} className={`transform transition-transform ${isSortDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                        {isSortDropdownOpen && (
                            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                                <ul className="max-h-60 overflow-y-auto py-1">
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'newest' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleSortChange('newest')}
                                    >
                                        Newest First
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'oldest' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleSortChange('oldest')}
                                    >
                                        Oldest First
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'name-asc' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleSortChange('name-asc')}
                                    >
                                        Name (A-Z)
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'name-desc' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleSortChange('name-desc')}
                                    >
                                        Name (Z-A)
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'price-low-high' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleSortChange('price-low-high')}
                                    >
                                        Price (Low to High)
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'price-high-low' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleSortChange('price-high-low')}
                                    >
                                        Price (High to Low)
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'stock-low-high' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleSortChange('stock-low-high')}
                                    >
                                        Stock (Low to High)
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'stock-high-low' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleSortChange('stock-high-low')}
                                    >
                                        Stock (High to Low)
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'featured-first' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleSortChange('featured-first')}
                                    >
                                        Featured First
                                    </li>
                                    <li
                                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortBy === 'non-featured-first' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => handleSortChange('non-featured-first')}
                                    >
                                        Non-Featured First
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Products Table */}
                {allDataLoading ? (
                    <div className="flex justify-center items-center gap-5 py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        <p className="text-gray-500">Loading products...</p>
                    </div>
                ) : productsError ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-center">
                        <strong className="font-bold">Error loading products:</strong>
                        <span className="block sm:inline ml-2">{productsError?.message || 'An unknown error occurred.'}</span>
                    </div>
                ) : displayedProducts?.length === 0 ? (
                    <div className="text-center py-8">
                        <h3 className="text-lg font-medium mb-2">No products found</h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm || productTypeFilter || eventFilter || stockFilter
                                ? 'Try adjusting your filters or search terms.'
                                : 'Get started by adding your first product.'}
                        </p>
                        {areFiltersActive ? (
                            <button
                                onClick={handleClearAllFilters}
                                className="btn btn-primary"
                            >
                                <Filter size={18} className="mr-2" /> Clear All Filters
                            </button>
                        ) : (
                            <Link to="/admin/products/new" className="btn btn-primary">
                                <Plus size={18} className="mr-2" /> Add New Product
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View (lg and above) */}
                        <div className="hidden lg:block overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {displayedProducts.map((product) => {
                                        // Determine if this is a simple or variant product
                                        const isSimpleProduct = product.price !== undefined && product.stock !== undefined;
                                        const isVariantProduct = product.variants && product.variants.length > 0;
                                        
                                        // Get price range for variant products
                                        const getPriceDisplay = () => {
                                            if (isSimpleProduct) {
                                                return getSimpleProductPrice(product);
                                            } else if (isVariantProduct) {
                                                return getVariantProductPrice(product);
                                            }
                                            return 'N/A';
                                        };

                                        // Get stock display
                                        const getStockDisplay = () => {
                                            if (isSimpleProduct) {
                                                return product.stock;
                                            } else if (isVariantProduct) {
                                                return product.variants.reduce((total, variant) => total + variant.stock, 0);
                                            }
                                            return 0;
                                        };

                                        // Get stock status
                                        const getStockStatus = () => {
                                            const totalStock = getStockDisplay();
                                            if (totalStock > 0) {
                                                return (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-100 text-success-800">
                                                        In Stock ({totalStock})
                                                    </span>
                                                );
                                            } else {
                                                return (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-error-100 text-error-800">
                                                        Out of Stock
                                                    </span>
                                                );
                                            }
                                        };

                                        // Get product image
                                        const getProductImage = () => {
                                            if (isSimpleProduct && product.images && product.images.length > 0) {
                                                return product.images[0].url;
                                            } else if (isVariantProduct && product.variants.length > 0) {
                                                const firstVariant = product.variants[0];
                                                if (firstVariant.images && firstVariant.images.length > 0) {
                                                    return firstVariant.images[0].url;
                                                }
                                            }
                                            return 'https://placehold.co/40x40/cccccc/333333?text=No+Image';
                                        };

                                        // Get product type indicator
                                        const getProductTypeIndicator = () => {
                                            if (isSimpleProduct) {
                                                return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Simple</span>;
                                            } else if (isVariantProduct) {
                                                return <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Variant ({product.variants.length})</span>;
                                            }
                                            return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Unknown</span>;
                                        };

                                        return (
                                            <tr key={product._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden">
                                                            <img 
                                                                src={getProductImage()} 
                                                                alt={product.name} 
                                                                className="h-full w-full object-cover" 
                                                                onError={(e) => e.target.src = 'https://placehold.co/40x40/cccccc/333333?text=No+Image'} 
                                                            />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                {Array.isArray(product.description) && product.description.length > 0
                                                                    ? product.description.slice(0, 2).join(', ') + (product.description.length > 2 ? '...' : '')
                                                                    : 'No description'}
                                                            </div>
                                                            <div className="mt-1">
                                                                {getProductTypeIndicator()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {product.productType?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getPriceDisplay()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStockStatus()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {product.isFeatured ? (
                                                        <CheckCircle2 size={18} className="text-green-500" />
                                                    ) : (
                                                        <XCircle size={18} className="text-gray-400" />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => navigate(`/admin/products/edit/${product.slug}`)} className="text-primary-500 hover:text-primary-600">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => openDeleteModal(product.slug)} className="text-error-500 hover:text-error-600">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile/Tablet Table Row View (sm and md) */}
                        <div className="lg:hidden space-y-3">
                            {displayedProducts.map((product) => {
                                // Determine if this is a simple or variant product
                                const isSimpleProduct = product.price !== undefined && product.stock !== undefined;
                                const isVariantProduct = product.variants && product.variants.length > 0;
                                
                                // Get price range for variant products
                                const getPriceDisplay = () => {
                                    if (isSimpleProduct) {
                                        return getSimpleProductPrice(product);
                                    } else if (isVariantProduct) {
                                        return getVariantProductPrice(product);
                                    }
                                    return 'N/A';
                                };

                                // Get stock display
                                const getStockDisplay = () => {
                                    if (isSimpleProduct) {
                                        return product.stock;
                                    } else if (isVariantProduct) {
                                        return product.variants.reduce((total, variant) => total + variant.stock, 0);
                                    }
                                    return 0;
                                };

                                // Get stock status
                                const getStockStatus = () => {
                                    const totalStock = getStockDisplay();
                                    if (totalStock > 0) {
                                        return (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-100 text-success-800">
                                                In Stock ({totalStock})
                                            </span>
                                        );
                                    } else {
                                        return (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-error-100 text-error-800">
                                                Out of Stock
                                            </span>
                                        );
                                    }
                                };

                                // Get product image
                                const getProductImage = () => {
                                    if (isSimpleProduct && product.images && product.images.length > 0) {
                                        return product.images[0].url;
                                    } else if (isVariantProduct && product.variants.length > 0) {
                                        const firstVariant = product.variants[0];
                                        if (firstVariant.images && firstVariant.images.length > 0) {
                                            return firstVariant.images[0].url;
                                        }
                                    }
                                    return 'https://placehold.co/40x40/cccccc/333333?text=No+Image';
                                };

                                // Get product type indicator
                                const getProductTypeIndicator = () => {
                                    if (isSimpleProduct) {
                                        return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Simple</span>;
                                    } else if (isVariantProduct) {
                                        return <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Variant ({product.variants.length})</span>;
                                    }
                                    return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Unknown</span>;
                                };

                                return (
                                    <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                        {/* Line 1: Product Name and Actions */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center flex-1 min-w-0">
                                                <div className="h-8 w-8 flex-shrink-0 rounded-md overflow-hidden mr-3">
                                                    <img 
                                                        src={getProductImage()} 
                                                        alt={product.name} 
                                                        className="h-full w-full object-cover" 
                                                        onError={(e) => e.target.src = 'https://placehold.co/40x40/cccccc/333333?text=No+Image'} 
                                                    />
                                                </div>
                                                <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-2">
                                                {product.isFeatured ? (
                                                    <CheckCircle2 size={14} className="text-green-500" />
                                                ) : (
                                                    <XCircle size={14} className="text-gray-400" />
                                                )}
                                                <button 
                                                    onClick={() => navigate(`/admin/products/edit/${product.slug}`)} 
                                                    className="p-1 text-primary-600 hover:text-primary-800"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(product.slug)} 
                                                    className="p-1 text-error-600 hover:text-error-800"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Line 2: Product Type and Price */}
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center space-x-2">
                                                {getProductTypeIndicator()}
                                                <span className="text-xs text-gray-500">
                                                    {product.productType?.name || 'N/A'}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{getPriceDisplay()}</span>
                                        </div>

                                        {/* Line 3: Stock Status */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1"></div>
                                            {getStockStatus()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full"
                    >
                        <div className="flex items-center justify-center text-error-500 mb-4">
                            <AlertCircle size={48} />
                        </div>
                        <h3 className="text-xl font-bold text-center mb-4">Delete Product</h3>
                        <p className="text-gray-600 text-center mb-6">
                            Are you sure you want to delete this product? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button onClick={closeDeleteModal} className="btn btn-outline" disabled={isDeleting}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteProduct} className="btn bg-error-500 text-white hover:bg-error-600" disabled={isDeleting}>
                                {isDeleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} className="mr-2" /> Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminProductsPage;
