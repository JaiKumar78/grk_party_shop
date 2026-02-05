import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '../../store/slices/cartSlice';
import { generateCartKey, normalizeProductForKey } from '../../store/slices/cartSlice';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'react-toastify'; // Import toast for user feedback

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items || []);

  // Determine if this is a simple or variant product
  const isSimpleProduct = product.price !== undefined && product.stock !== undefined;
  const isVariantProduct = product.variants && product.variants.length > 0;

  // Get price display for both simple and variant products
  const getPriceDisplay = () => {
    if (isSimpleProduct) {
      return `₹${product.price.toFixed(2)}`;
    } else if (isVariantProduct) {
      // Show price of first variant instead of price range
      const firstVariant = product.variants[0];
      return `₹${firstVariant.price.toFixed(2)}`;
    }
    return 'N/A';
  };

  // Get stock display for both simple and variant products
  const getStockDisplay = () => {
    if (isSimpleProduct) {
      return product.stock;
    } else if (isVariantProduct) {
      return product.variants.reduce((total, variant) => total + variant.stock, 0);
    }
    return 0;
  };

  // Get product image for both simple and variant products
  const getProductImage = () => {
    if (isSimpleProduct && product.images && product.images.length > 0) {
      return product.images[0].url;
    } else if (isVariantProduct && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.images && firstVariant.images.length > 0) {
        return firstVariant.images[0].url;
      }
    }
    return 'https://placehold.co/400x400/cccccc/333333?text=No+Image';
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

  const handleAddToCart = (e) => {
    e.preventDefault();

    if (!product || !product._id) {
      toast.error("Cannot add an invalid product to cart: Missing product ID.");
      return;
    }

    if (isSimpleProduct) {
      if (typeof product.price !== 'number' || product.price <= 0) {
        toast.error(`Cannot add \"${product.name || 'this product'}\" to cart: Invalid price.`);
        return;
      }
      if (product.stock <= 0) {
        toast.error(`\"${product.name || 'This product'}\" is out of stock.`);
        return;
      }
      // Check cart for existing quantity
      const cartQuantity = cartItems.find(item => item.product._id === product._id)?.quantity || 0;
      if (cartQuantity + 1 > product.stock) {
        toast.error(`You already have ${cartQuantity} in your cart. Only ${product.stock} in stock.`);
        return;
      }
      dispatch(addItem({ product: product, quantity: 1 }));
      toast.success(`\"${product.name}\" added to cart!`);
    } else if (isVariantProduct) {
      const firstVariant = product.variants[0];
      if (!firstVariant || firstVariant.stock <= 0) {
        toast.error(`\"${product.name}\" is out of stock.`);
        return;
      }
      // FIXED: Check cart for existing quantity using the correct key generation logic
      const cartQuantity = cartItems.find(item => {
        // Use helper function to normalize the cart item
        const { productId: itemProductId, variantId: itemVariantId } = normalizeProductForKey(item.product);
        // Check if this cart item matches the variant we're trying to add
        return itemProductId === product._id && itemVariantId === firstVariant._id;
      })?.quantity || 0;
      
      if (cartQuantity + 1 > firstVariant.stock) {
        toast.error(`You already have ${cartQuantity} in your cart. Only ${firstVariant.stock} in stock.`);
        return;
      }
      const variantCartItem = {
        ...firstVariant,
        parentProductId: product._id,
        parentProductName: product.name,
        variantId: firstVariant._id, // Ensure variantId is set for cart merging
      };
      dispatch(addItem({ product: variantCartItem, quantity: 1 }));
      toast.success(`\"${product.name} (${firstVariant.sku || firstVariant.name || 'Variant'})\" added to cart!`);
    }
  };

  const imageUrl = getProductImage();
  const currentStock = getStockDisplay();
  const currentPrice = getPriceDisplay();

  // Access productType and event directly from the product object
  // Ensure they are objects before trying to access .name
  const productTypeName = (product.productType && typeof product.productType === 'object')
    ? product.productType.name
    : null;

  // Event is an array of populated objects, map to array of names
  const eventName = (product.event && Array.isArray(product.event) && product.event.length > 0 && typeof product.event[0] === 'object')
    ? product.event.map(evt => evt.name).join(', ') // Join multiple event names if event is an array of populated objects
    : null;

  // Get description for display
  const getDescription = () => {
    if (Array.isArray(product.description) && product.description.length > 0) {
      // Show first 2 description points, truncate if longer
      const displayDesc = product.description.slice(0, 2).join(', ');
      return displayDesc.length > 80 ? displayDesc.substring(0, 80) + '...' : displayDesc;
    }
    return 'High-quality party supplies for your special occasion.';
  };

  const cartQuantity = isSimpleProduct
    ? cartItems.find(item => item.product._id === product._id)?.quantity || 0
    : isVariantProduct
      ? cartItems.find(item => {
          // Use helper function to normalize the cart item
          const { productId: itemProductId, variantId: itemVariantId } = normalizeProductForKey(item.product);
          // Check if this cart item matches the first variant of this product
          return itemProductId === product._id && itemVariantId === product.variants[0]._id;
        })?.quantity || 0
      : 0;
  const maxStock = isSimpleProduct ? product.stock : isVariantProduct ? product.variants[0].stock : 0;
  const isMaxInCart = cartQuantity >= maxStock;

  return (
    <Link to={`/collections/${product.slug}`} className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 bg-white flex flex-col h-full">
      {/* Product Image Section with Hover Overlay */}
      <div className="relative overflow-hidden h-40 md:h-64 flex-shrink-0"> {/* flex-shrink-0 ensures fixed height for image */}
        <img
          src={imageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ${currentStock <= 0 && "group-hover:grayscale"}`}
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/400x400/cccccc/333333?text=Image+Error`;
            e.currentTarget.onerror = null;
          }}
        />

        {/* Quick Add to Cart or Out of Stock Overlay - Only on desktop (lg and above) */}
        <div className="hidden lg:block">
          {currentStock > 0 ? (
              <div className="absolute inset-0 bg-white/5 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(e);
                  }}
                  disabled={isMaxInCart || currentStock <= 0}
                  className={`${isMaxInCart || currentStock <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-600'} text-white font-bold px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2`}
                  aria-label={`Add ${product.name} to cart`}
                >
                  <ShoppingBag size={16} />
                  {isMaxInCart || currentStock <= 0 ? 'Max in Cart' : 'Add to Cart'}
                </button>
              </div>
          ) : (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-lg font-bold bg-red-500 px-3 py-1 rounded-full ">Out of Stock</span>
              </div>
          )}
        </div>

        {/* Featured Badge */}
        {product.isFeatured && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full uppercase">
            Featured
          </span>
        )}
      </div>

      {/* Product Information Section */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        {/* Product Name - Added line-clamp-2 for consistent height */}
        <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-pink-600 transition-colors line-clamp-2">
          {product.name}
        </h3>

        {/* Description and Product Type only on md+ screens */}
        <div className="hidden md:block">
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {getDescription()}
          </p>
        </div>

        {/* Price and Category/Event Info - mt-auto pushes this to the bottom of the flex-grow container */}
        <div className='flex justify-between items-center'>
          <div className="flex justify-between items-center mt-auto pt-2"> {/* Added pt-2 for slight separation */}
            {/* Use the calculated price display */}
            <p className="text-purple-600 font-bold">{currentPrice}</p>
          </div>
          <div className="hidden md:block text-sm text-gray-500">
              {productTypeName && (
                <span className="whitespace-nowrap">{productTypeName}</span>
              )}
          </div>
        </div>
      </div>

      {/* Add to Cart Button - Only on mobile */}
      <button
        onClick={handleAddToCart}
        disabled={isMaxInCart || currentStock <= 0}
        className={`block md:hidden w-full ${isMaxInCart || currentStock <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 text-white'} font-semibold py-3 rounded-b-lg text-base transition-colors duration-200 ${isMaxInCart ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={`Add ${product.name} to cart`}
        style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        tabIndex={isMaxInCart || currentStock <= 0 ? -1 : 0}
      >
        {/* {isMaxInCart ? 'Max in Cart' : 'Add to Cart'} */}
        {currentStock <= 0 ? 'Out of Stock' : isMaxInCart ? 'Max in Cart' : 'Add to Cart'}
      </button>
    </Link>
  );
};

export default ProductCard;
