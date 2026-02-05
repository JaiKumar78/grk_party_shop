import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    useGetProductByIdOrSlugQuery, // Changed to useGetProductByIdOrSlugQuery
    useGetProductsQuery // For fetching all products for related items
} from '../../store/api/productsApi';
import { addItem, normalizeProductForKey } from '../../store/slices/cartSlice'; // Redux action to add items to cart
import ProductCard from '../../components/consumer/ProductCard'; // Import ProductCard for related products
import { ShoppingBag, CreditCard, ArrowLeft, Loader2, ImageOff } from 'lucide-react'; // Icons
import { toast } from 'react-toastify'; // For notifications
import { motion } from 'framer-motion';

const ProductDetailPage = () => {
    const { slug } = useParams(); // Get product slug from URL
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const cartItems = useSelector(state => state.cart.items || []);
    const addToCartBtnRef = useRef(null);

    // Fetch product details for the current product by Slug
    const {
        data: product,
        isLoading: isProductLoading,
        isError: isProductError,
        error: productError
    } = useGetProductByIdOrSlugQuery(slug); // Using the updated hook

    // Fetch all products to find related ones (client-side filtering for related)
    const { data: allProducts, isLoading: areAllProductsLoading } = useGetProductsQuery();

    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState(''); // State for the currently displayed main image
    const [imageError, setImageError] = useState(false); // State to track main image loading errors

    // New states for variant handling
    const [selectedVariant, setSelectedVariant] = useState(null); // The full selected variant object
    const [selectedAttributes, setSelectedAttributes] = useState({}); // Stores chosen attribute values, e.g., {color: 'Red', size: 'M'}

    // Effect to initialize selectedVariant and mainImage when product data loads
    useEffect(() => {
        if (product) {
            if (product.variants && product.variants.length > 0) {
                // Product has variants: Initialize with the first variant
                const initialVariant = product.variants[0];
                setSelectedVariant(initialVariant);
                setMainImage(initialVariant.images[0]?.url || '');
                // Initialize selected attributes from the first variant's attributes
                setSelectedAttributes(initialVariant.attributes || {});
            } else {
                // Simple product: The product itself acts as the "selected variant"
                setSelectedVariant(product);
                setMainImage(product.images[0]?.url || '');
            }
            setImageError(false); // Reset image error when a new product is loaded
            setQuantity(1); // Reset quantity
            window.scrollTo(0, 0); // Scroll to top on page load/product change
        }
    }, [product]);

    // Effect to update main image when selectedVariant changes (e.g., user selects a different variant)
    useEffect(() => {
        if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
            setMainImage(selectedVariant.images[0].url);
            setImageError(false);
        } else if (selectedVariant && !selectedVariant.images) {
            // Fallback if the selected variant has no images (shouldn't happen with proper validation)
            setMainImage(''); // Or a default placeholder
            setImageError(true);
        }
    }, [selectedVariant]);

    // Helper to get unique attribute names (e.g., 'Color', 'Size') from all variants
    const getUniqueAttributeNames = useCallback(() => {
        if (!product || !product.variants || product.variants.length === 0) return [];
        const attributeNames = new Set();
        product.variants.forEach(v => {
            if (v.attributes) {
                Object.keys(v.attributes).forEach(key => attributeNames.add(key));
            }
        });
        return Array.from(attributeNames);
    }, [product]);

    // Helper to get unique attribute values for a given attribute name (e.g., ['Red', 'Blue'] for 'Color')
    const getUniqueAttributeValues = useCallback((attributeName) => {
        if (!product || !product.variants) return [];
        const values = new Set();
        product.variants.forEach(v => {
            // Only add values if they match the currently selected *other* attributes
            const isMatch = Object.keys(selectedAttributes).every(key => {
                if (key === attributeName) return true; // Don't filter by the current attribute being selected
                return v.attributes[key] === selectedAttributes[key];
            });
            if (isMatch && v.attributes && v.attributes[attributeName]) {
                values.add(v.attributes[attributeName]);
            }
        });
        return Array.from(values);
    }, [product, selectedAttributes]);


    // Handle attribute selection (e.g., user clicks 'Red' for Color)
    const handleAttributeSelect = (attributeName, value) => {
        const newSelectedAttributes = {
            ...selectedAttributes,
            [attributeName]: value
        };
        setSelectedAttributes(newSelectedAttributes);

        // Find the variant that matches ALL currently selected attributes
        const matchedVariant = product.variants.find(v => {
            // Check if every selected attribute (key and value) matches this variant's attributes
            return Object.keys(newSelectedAttributes).every(key =>
                v.attributes && v.attributes[key] === newSelectedAttributes[key]
            );
        });

        if (matchedVariant) {
            setSelectedVariant(matchedVariant);
            setQuantity(1); // Reset quantity when variant changes
        } else {
            // This case might mean an invalid combination, e.g., if "Red" and "XL" don't exist together
            setSelectedVariant(null); // No variant matches
            setQuantity(0); // Set quantity to 0 as it's not purchasable
            toast.error("This combination is not available. Please try another selection.");
        }
    };

    // Determine the product or variant currently being displayed/added to cart
    // This will be `selectedVariant` if product has variants, or the `product` object itself for simple products
    const displayProduct = selectedVariant;

    // Calculate cart quantity for the selected product or variant
    let cartQuantity = 0;
    if (selectedVariant && selectedVariant._id) {
        // Use helper function to normalize cart items and find the correct quantity
        cartQuantity = cartItems.find(item => {
            // Use helper function to normalize the cart item
            const { productId: itemProductId, variantId: itemVariantId } = normalizeProductForKey(item.product);
            // Check if this cart item matches the selected variant
            return itemProductId === product._id && itemVariantId === selectedVariant._id;
        })?.quantity || 0;
    }
    const maxStock = selectedVariant ? selectedVariant.stock : 0;
    const maxSelectableQuantity = Math.max(0, maxStock - cartQuantity);
    const isMaxInCart = cartQuantity >= maxStock;

    // Handle adding product to cart
    const handleAddToCart = () => {
        if (!displayProduct || displayProduct.stock <= 0) {
            toast.error('Product is out of stock or not available.');
            return;
        }

        const finalQuantity = Math.min(quantity, displayProduct.stock);
        if (finalQuantity <= 0) {
            toast.error('Product is out of stock.');
            return;
        }

        // If this is a variant, add parentProductName and parentProductSlug
        let productToAdd = displayProduct;
        if (product.variants && product.variants.length > 0 && displayProduct._id !== product._id) {
            productToAdd = {
                ...displayProduct,
                parentProductName: product.name,
                parentProductSlug: product.slug,
                parentProductId: product._id, // Add parent product ID for cart normalization
                variantId: displayProduct._id, // Ensure variantId is set for cart merging
            };
        }
        dispatch(addItem({ product: productToAdd, quantity: finalQuantity }));
        // Include SKU in toast for clarity if it's a variant
        toast.success(`${finalQuantity} x ${product.name}${displayProduct.sku ? ` (${displayProduct.sku})` : ''} added to cart!`);
        setQuantity(1); // Optionally reset quantity to 1 after adding to cart
        // Auto-unfocus the Add to Cart button
        if (addToCartBtnRef.current) {
            addToCartBtnRef.current.blur();
        }
    };

    // Handle "Buy Now" functionality (similar to Add to Cart)
    const handleBuyNow = () => {
        if (!displayProduct || displayProduct.stock <= 0) {
            toast.error('Product is out of stock or not available.');
            return;
        }

        const finalQuantity = Math.min(quantity, displayProduct.stock);
        if (finalQuantity <= 0) {
            toast.error('Product is out of stock.');
            return;
        }

        // FIXED: Add parentProductId consistently like handleAddToCart
        let productToAdd = displayProduct;
        if (product.variants && product.variants.length > 0 && displayProduct._id !== product._id) {
            productToAdd = {
                ...displayProduct,
                parentProductName: product.name,
                parentProductSlug: product.slug,
                parentProductId: product._id, // Add parent product ID for cart normalization
                variantId: displayProduct._id, // Ensure variantId is set for cart merging
            };
        }
        
        dispatch(addItem({ product: productToAdd, quantity: finalQuantity })); // Add to cart
        toast.success(`${finalQuantity} x ${product.name}${displayProduct.sku ? ` (${displayProduct.sku})` : ''} added to cart. Redirecting to checkout!`);
        navigate('/cart'); // Or '/checkout' if you have a separate checkout route
    };

    // Handle image load errors for main image
    const onMainImageError = (e) => {
        e.currentTarget.src = 'https://placehold.co/600x400/cccccc/333333?text=Image+Error';
        e.currentTarget.onerror = null;
        setImageError(true);
    };

    // Handle thumbnail image load errors
    const onThumbnailError = (e) => {
        e.currentTarget.src = 'https://placehold.co/80x80/cccccc/333333?text=Thumb';
        e.currentTarget.onerror = null;
    };

    // --- Loading, Error, and Not Found States ---
    if (isProductLoading || areAllProductsLoading) {
        return (
            <div className="pt-24 pb-16 min-h-screen bg-gray-50 flex flex-col gap-3 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                <p className="text-gray-700 text-lg">Loading product details...</p>
            </div>
        );
    }

    // if product data is not available, product will be null
    if (isProductError || !product) {
        let errorMessage = 'Product not found.';
        if (productError && 'status' in productError) {
            errorMessage = `Error: ${productError.status} - ${productError.data?.message || 'Failed to fetch product.'}`;
        } else if (productError) {
            errorMessage = productError.message || 'An unexpected error occurred.';
        }

        return (
            <div className="pt-24 pb-16 min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
                <ImageOff className="text-red-500 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-red-700 mb-2">Oops! {errorMessage}</h2>
                <p className="text-gray-600 mb-6">
                    The product you are looking for might not exist or there was an issue loading it.
                </p>
                <Link to="/products" className="btn btn-primary flex items-center">
                    <ArrowLeft size={18} className="mr-2" /> Back to Products
                </Link>
            </div>
        );
    }

    // Determine product type and event names from populated categories
    const productType = product.productType?.name || 'Uncategorized';
    const eventNames = Array.isArray(product.event) && product.event.length > 0
        ? product.event.map(evt => evt.name).join(', ')
        : 'N/A';

    // Logic for "Related Products": Filter by same productType and limit to 4
    const relatedProducts = allProducts
        ? allProducts
            .filter(p => p._id !== product._id && p.productType?._id === product.productType?._id)
            .slice(0, 4) // Show up to 4 related products
        : [];

    // Determine if the product uses variants or is a simple product
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const availableStock = displayProduct?.stock || 0;
    const currentPrice = displayProduct?.price?.toFixed(2) || '0.00';
    const currentImages = displayProduct?.images || [];

    const uniqueAttributeNames = getUniqueAttributeNames();

    return (
        <div className="pt-24 pb-16 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Breadcrumb navigation */}
                <nav className="mb-6 text-sm text-gray-500">
                    <ol className="list-none p-0 inline-flex">
                        <li className="flex items-center">
                            <Link to="/" className="hover:text-pink-600 transition-colors">Home</Link>
                            <span className="mx-2">/</span>
                        </li>
                        <li className="flex items-center">
                            <Link to="/products" className="hover:text-pink-600 transition-colors">Collections</Link>
                        </li>
                    </ol>
                </nav>

                <div className="flex flex-col lg:flex-row gap-8 bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                    {/* Product Image Gallery */}
                    <div className="lg:w-1/2 lg:sticky lg:top-16 lg:self-start lg:h-fit">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="relative mb-4 overflow-hidden rounded-xl border border-gray-200 shadow-lg"
                        >
                            <img
                                src={imageError ? 'https://placehold.co/600x400/cccccc/333333?text=Image+Error' : mainImage}
                                alt={product.name}
                                className="w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] object-contain rounded-xl transition-transform duration-300 transform"
                                onError={onMainImageError}
                            />
                        </motion.div>
                        {currentImages.length > 1 && (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mt-4">
                                {currentImages.map((img, index) => (
                                    <motion.img
                                        key={index}
                                        src={img.url}
                                        alt={`${product.name} thumbnail ${index + 1}`}
                                        className={`w-full h-20 object-cover rounded-lg cursor-pointer border-2 ${mainImage === img.url ? 'border-pink-500 shadow-md' : 'border-transparent'} hover:border-pink-500 transition-all duration-200 transform hover:scale-105`}
                                        onClick={() => {
                                            setMainImage(img.url);
                                            setImageError(false); // Reset error when changing image
                                        }}
                                        onError={onThumbnailError}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="lg:w-1/2 flex flex-col justify-between">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            {/* GRK PARTY SHOP Brand Text */}
                            <div className="mb-2">
                                <h2 className="brand-text">
                                    GRK PARTY SHOP
                                </h2>
                            </div>

                            <h1 className="text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>

                            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center mb-4">
                                <span className="text-3xl font-extrabold text-rose-600">₹{currentPrice}</span>
                                {availableStock > 0 ? (
                                    <span className={`ml-4 text-sm py-1 px-3 rounded-full font-medium shadow-sm ${
                                        availableStock <= 10 
                                            ? 'bg-orange-100 text-orange-800' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {availableStock <= 10 ? 'Hurry! Only few stocks left!' : 'In Stock'}
                                    </span>
                                ) : (
                                    <span className="ml-4 text-sm bg-red-100 text-red-800 py-1 px-3 rounded-full font-medium shadow-sm">
                                        Out of Stock
                                    </span>
                                )}
                            </div>

                            {/* Variant Selection UI */}
                            {hasVariants && uniqueAttributeNames.map(attrName => (
                                <div key={attrName} className="mb-6">
                                    <label className="block text-md font-medium text-gray-700 mb-2">
                                        Select {attrName}:
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {getUniqueAttributeValues(attrName).map(value => {
                                            // Find the variant that would be selected if this attribute value is chosen
                                            const potentialAttributes = {
                                                ...selectedAttributes,
                                                [attrName]: value
                                            };
                                            const potentialVariant = product.variants.find(v => {
                                                return Object.keys(potentialAttributes).every(key =>
                                                    v.attributes && v.attributes[key] === potentialAttributes[key]
                                                );
                                            });
                                            const isLowStock = potentialVariant && potentialVariant.stock > 0 && potentialVariant.stock <= 10;
                                            
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => handleAttributeSelect(attrName, value)}
                                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 relative
                                                        ${selectedAttributes[attrName] === value
                                                            ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                        }
                                                    `}
                                                >
                                                    {value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Quantity Selector */}
                            <div className="mb-8">
                                <label htmlFor="quantity" className="block text-md font-medium text-gray-700 mb-2">
                                    Select Quantity:
                                </label>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit shadow-sm">
                                    <button
                                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                        className="p-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-bold text-lg"
                                        disabled={availableStock === 0 || quantity <= 1 || !displayProduct}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        id="quantity"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, Math.min(maxSelectableQuantity, parseInt(e.target.value) || 1)))}
                                        className="w-16 p-3 text-center border-x border-gray-300 focus:outline-none focus:ring-0 text-lg font-semibold"
                                        min="1"
                                        max={maxSelectableQuantity}
                                        disabled={availableStock === 0 || !displayProduct}
                                    />
                                    <button
                                        onClick={() => setQuantity(prev => Math.min(maxSelectableQuantity, prev + 1))}
                                        className="p-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-bold text-lg"
                                        disabled={availableStock === 0 || quantity >= maxSelectableQuantity || !displayProduct || isMaxInCart}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col gap-4 mt-auto pt-6 border-t border-gray-200"
                        >
                            <button
                                ref={addToCartBtnRef}
                                onClick={handleAddToCart}
                                disabled={availableStock === 0 || quantity > availableStock || !displayProduct || isMaxInCart}
                                className={`btn btn-primary w-full px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2
                                    ${availableStock > 0 && quantity <= availableStock && displayProduct && !isMaxInCart ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-gray-300 cursor-not-allowed text-gray-500'}
                                `}
                            >
                                <ShoppingBag size={20} />
                                {/* {isMaxInCart ? 'Max in Cart' : 'Add to Cart'} */}
                                {availableStock <= 0 ? 'Add to Cart' : isMaxInCart ? 'Max in Cart' : 'Add to Cart'}
                            </button>

                            <button
                                onClick={handleBuyNow}
                                disabled={availableStock === 0 || quantity > availableStock || !displayProduct }
                                className={`btn btn-secondary w-full px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2
                                    ${availableStock > 0 && quantity <= availableStock && displayProduct ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-300 cursor-not-allowed text-gray-500'}
                                `}
                            >
                                <CreditCard size={20} />
                                Buy Now
                            </button>
                        </motion.div>

                        {/* Description Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="mt-6 text-gray-700 pt-6 border-t border-gray-200"
                        >
                            <h3 className="font-semibold text-xl mb-2 border-b border-gray-200 pb-2">What's Included:</h3>
                            <ul className="space-y-2 text-base">
                                {Array.isArray(product.description) && product.description.length > 0 ? (
                                    product.description.map((desc, index) => {
                                        // Split the description by ":" to separate label and content
                                        const parts = desc.split(':');
                                        const label = parts[0];
                                        const content = parts.slice(1).join(':').trim();
                                        
                                        return (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="text-pink-500 mt-1">🎁</span>
                                                <div>
                                                    <span className="font-bold italic text-gray-800">{label}:</span>
                                                    {content && <span className="text-gray-700"> {content}</span>}
                                                </div>
                                            </li>
                                        );
                                    })
                                ) : (
                                    <li className="flex items-start gap-3">
                                        <span className="text-pink-500 mt-1">🎁</span>
                                        <span className="text-gray-700">High-quality party supplies for your special occasion.</span>
                                    </li>
                                )}
                            </ul>
                        </motion.div>

                    </div> {/* End of lg:w-1/2 flex flex-col justify-between */}
                </div> {/* End of main product detail grid */}

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <section className="mt-16 bg-white p-8 rounded-xl shadow-xl border border-gray-100">
                        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">You might also like</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {relatedProducts.map(relatedProduct => (
                                <motion.div
                                    key={relatedProduct._id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.1 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <ProductCard product={relatedProduct} />
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default ProductDetailPage;
