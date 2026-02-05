// AdminProductFormPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// Assuming these RTK Query hooks are correctly defined in your store
// For a standalone example, these would need to be mocked or replaced with simple fetch calls
import {
    useGetProductByIdOrSlugQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
} from '../../store/api/productsApi';
import { useGetAllCategoriesQuery } from '../../store/api/categoriesApi';
import { useGetAllEventsQuery } from '../../store/api/eventsApi';
import { toast } from 'react-toastify'; // Assuming toast notifications are set up
import { Plus, Minus, X, Image, ArrowLeft, Save, Upload, Trash2, ChevronDown, ChevronRight } from 'lucide-react'; // Icons

// --- Helper for SKU Generation ---
// This function now expects an array of attribute objects [{name: "color", value: "red"}]
const generateSku = (productName, attributesArray, variantIndex = 0) => {
    console.log("generateSku called with:", { productName, attributesArray, variantIndex });
    
    let skuParts = [];
    if (productName) {
        skuParts.push(
            productName.toUpperCase()
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/[^A-Z0-9-]/g, '') // Remove non-alphanumeric characters except hyphens
                .replace(/--+/g, '-') // Replace multiple hyphens with a single one
                .trim()
        );
    }

    console.log("Product name processed:", skuParts[0]);

    // Sort attributes by name to ensure consistent SKU generation regardless of attribute order
    const sortedAttributes = (attributesArray || [])
        .slice() // Create a shallow copy to avoid mutating the original array
        .sort((a, b) => a.name.localeCompare(b.name));

    console.log("Sorted attributes:", sortedAttributes);

    sortedAttributes.forEach(attr => {
        if (attr.name && attr.value) { // Ensure both name and value exist
            const processedValue = String(attr.value).toUpperCase() // Ensure value is string, then to uppercase
                .replace(/\s+/g, '-')
                .replace(/[^A-Z0-9-]/g, '')
                .replace(/--+/g, '-')
                .trim();
            skuParts.push(processedValue);
            console.log(`Added attribute: ${attr.name}=${attr.value} -> ${processedValue}`);
        } else {
            console.log(`Skipping invalid attribute:`, attr);
        }
    });

    // Add timestamp to ensure uniqueness even when attributes are identical
    const timestamp = Date.now().toString(36); // Convert timestamp to base36 for shorter string
    skuParts.push(timestamp);
    console.log("Added timestamp:", timestamp);

    const finalSku = skuParts.join('-');
    console.log("Final SKU:", finalSku);
    return finalSku;
};


// --- Zod Schemas for Flexible Product Structure ---

// Zod schema for a single attribute (used within variants)
const attributeSchema = z.object({
    id: z.string().optional(), // Used for unique keying in React list, generated if new
    name: z.string().min(1, 'Attribute name is required.'),
    value: z.string().min(1, 'Attribute value is required.'),
});

// Zod schema for a single image (used in both simple and variant products)
const imageSchema = z.object({
    url: z.string().url().optional(), // URL for existing images
    public_id: z.string().optional(), // Public ID for existing images
    // File object for new uploads (only present on frontend)
    file: typeof window === 'undefined' ? z.any().optional() : z.instanceof(File).optional(),
    previewUrl: z.string().optional(), // For local file previews before upload
});

// Zod schema for a single variant
const variantSchema = z.object({
    id: z.string().optional(), // For useFieldArray keying, generated if new
    _id: z.string().optional(), // Backend ID for existing variants
    sku: z.string().optional(), // SKU is now optional/auto-generated, not a required input
    // Attributes are now an array of attributeSchema objects
    attributes: z.array(attributeSchema).min(1, 'At least one attribute is required for a variant.'),
    price: z.number().positive('Price must be positive').min(0.01, 'Price must be at least 0.01'),
    stock: z.number().min(0, 'Stock must be a non-negative number'),
    // *** FIXED: Made images required for variants ***
    images: z.array(imageSchema).min(1, 'At least one image is required for a variant'),
});

// Zod schema for common product fields
const baseProductSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').trim(),
    description: z.array(
        z.string().min(10, 'Description item cannot be empty').trim()
    ).min(1, 'At least one description point is required'),
    productType: z.string().min(1, 'Product Type is required'),
    event: z.array(z.string().min(1, 'Event ID cannot be empty'))
                 .max(5, 'Maximum 5 events are allowed'),
    isFeatured: z.boolean(),
});

// Zod schema for simple product specific fields
const simpleProductFieldsSchema = z.object({
    price: z.number().positive('Price must be positive').min(0.01, 'Price must be at least 0.01'),
    stock: z.number().min(0, 'Stock must be a non-negative number'),
    images: z.array(imageSchema).min(1, 'At least one image is required for a simple product').max(10, 'Maximum 10 images are allowed'),
});

// Zod schema for variant product specific fields
const variantProductFieldsSchema = z.object({
    variants: z.array(variantSchema)
        .min(1, 'At least one variant is required for a variant product'),
});

// Custom resolver function to handle conditional schema validation
const productFormResolver = (values, context) => {
    const isVariantProductForm = values.productTypeSelection === 'variants';

    let schemaToApply;
    if (isVariantProductForm) {
        schemaToApply = baseProductSchema.merge(variantProductFieldsSchema);
    } else {
        schemaToApply = baseProductSchema.merge(simpleProductFieldsSchema);
    }
    
    // Use safeParse to get detailed errors
    const result = schemaToApply.safeParse(values);
    if (result.success) {
        return { values: result.data, errors: {} };
    } else {
        // Zod's formErrors.fieldErrors provides a good structure for react-hook-form
        return { values: {}, errors: result.error.formErrors.fieldErrors };
    }
};

const AdminProductFormPage = () => {
    // Console log to check if component is rendering
    console.log("AdminProductFormPage: Component Rendered");

    const { slug } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!slug;

    // RTK Query hooks for product data (using slug)
    const { data: product, isLoading: isProductLoading, isError: isProductError, error: productError } = useGetProductByIdOrSlugQuery(slug || '', {
        skip: !isEditMode, // Skip query if not in edit mode
    });

    // RTK Query hooks for categories and events
    const { data: categories, isLoading: areCategoriesLoading, error: categoriesError } = useGetAllCategoriesQuery();
    const { data: events, isLoading: areEventsLoading, error: eventsError } = useGetAllEventsQuery();

    // RTK Query hooks for mutations
    const [createProduct, { isLoading: isCreatingProduct }] = useCreateProductMutation();
    const [updateProduct, { isLoading: isUpdatingProduct }] = useUpdateProductMutation();

    // State to manage overall form submission loading (beyond RTK Query's isLoading)
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Track collapsed variants by their local id
    const [collapsedVariantIds, setCollapsedVariantIds] = useState(new Set());
    const toggleVariantCollapse = (variantLocalId) => {
        setCollapsedVariantIds((prev) => {
            const next = new Set(prev);
            if (next.has(variantLocalId)) {
                next.delete(variantLocalId);
            } else {
                next.add(variantLocalId);
            }
            return next;
        });
    };

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors },
        reset,
        watch,
    } = useForm({
        resolver: productFormResolver, // Use custom resolver
        defaultValues: {
            name: '',
            description: [''],
            productType: '',
            event: [],
            isFeatured: false,
            // Simple product fields
            price: 0,
            stock: 0,
            images: [],
            // Variant product fields
            variants: [{
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9), // Unique ID for new variant
                sku: '', // Will be auto-generated
                attributes: [{
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9), // Unique ID for new attribute
                    name: '',
                    value: ''
                }],
                price: 0,
                stock: 0,
                images: [] // This is correctly empty by default for new variants
            }],
            // Control field for type selection (not part of actual product model sent to backend)
            productTypeSelection: 'simple', // 'simple' or 'variants'
        },
    });

    // Watch values that determine the product type and others
    const watchedProductTypeSelection = watch('productTypeSelection');
    const watchedDescriptionFields = watch('description');
    const watchedEvents = watch('event');
    const watchedName = watch('name'); // Watch product name for SKU generation
    const watchedVariants = watch('variants'); // Watch variants for SKU generation

    // Console log watched product type selection
    console.log("watchedProductTypeSelection:", watchedProductTypeSelection);
    // Console log the entire errors object
    console.log("Form Errors:", errors);


    // UseFieldArray for description
    const { fields: descriptionFields, append: appendDescription, remove: removeDescription } = useFieldArray({
        control,
        name: 'description',
    });

    // UseFieldArray for variants
    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control,
        name: 'variants',
    });

    // Helper functions for manipulating attributes in variants
    const addAttributeToVariant = (variantIndex) => {
        const variants = watch('variants');
        const newAttrId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        const updatedAttributes = [
            ...variants[variantIndex].attributes,
            { id: newAttrId, name: '', value: '' },
        ];
        const updatedVariants = variants.map((variant, idx) =>
            idx === variantIndex ? { ...variant, attributes: updatedAttributes } : variant
        );
        setValue('variants', updatedVariants, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    };

    const removeAttributeFromVariant = (variantIndex, attrIndex) => {
        const variants = watch('variants');
        const updatedAttributes = variants[variantIndex].attributes.filter((_, i) => i !== attrIndex);
        const updatedVariants = variants.map((variant, idx) =>
            idx === variantIndex ? { ...variant, attributes: updatedAttributes } : variant
        );
        setValue('variants', updatedVariants, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    };

    // Scroll to top on mount
    useEffect(() => {
        console.log("AdminProductFormPage: Component Mounted/Updated - Scrolling to top");
        window.scrollTo(0, 0);
    }, []);

    // Ensure at least one description field exists
    useEffect(() => {
        if (descriptionFields.length === 0) {
            console.log("Description fields empty, appending one.");
            appendDescription('');
        }
    }, [descriptionFields, appendDescription]);

    // Effect to auto-generate SKUs when product name or variant attributes change
    useEffect(() => {
        console.log("SKU Generation Effect Triggered. watchedName:", watchedName, "watchedProductTypeSelection:", watchedProductTypeSelection);
        console.log("watchedVariants:", watchedVariants);
        // Only generate SKUs if the form is in variant mode and product name is available
        if (watchedProductTypeSelection === 'variants' && watchedName) {
            watchedVariants.forEach((variant, index) => {
                console.log(`Processing variant ${index}:`, variant);
                console.log(`Variant ${index} attributes:`, variant.attributes);
                
                // Check if variant has valid attributes
                const hasValidAttributes = variant.attributes && 
                    Array.isArray(variant.attributes) && 
                    variant.attributes.length > 0 && 
                    variant.attributes.some(attr => attr.name && attr.value);
                
                let newSku;
                if (hasValidAttributes) {
                    // Generate SKU with attributes
                    newSku = generateSku(watchedName, variant.attributes, index);
                    console.log(`Generated SKU with attributes for variant ${index}:`, newSku);
                } else {
                    // Generate placeholder SKU for new variants
                    newSku = generateSku(watchedName, [], index);
                    console.log(`Generated placeholder SKU for variant ${index}:`, newSku);
                }
                
                // Always update SKU if it has changed
                if (control._formValues.variants?.[index]?.sku !== newSku) {
                    console.log(`Updating SKU for variant ${index}: Old=${control._formValues.variants?.[index]?.sku}, New=${newSku}`);
                    setValue(`variants.${index}.sku`, newSku, { shouldDirty: true });
                }
            });
        }
    }, [watchedName, watchedVariants, watchedProductTypeSelection, setValue]); // Removed control._formValues.variants

    // Effect to populate form when in edit mode and product data is available
    useEffect(() => {
        if (isEditMode && product) {
            console.log("Product data received for reset (Edit Mode):", product);

            // Determine if it's a variant product from fetched data
            const productHasVariants = Array.isArray(product.variants) && product.variants.length > 0;

            // Prepare values for reset
            const resetValues = {
                name: product.name || '',
                description: Array.isArray(product.description) && product.description.length > 0
                    ? product.description
                    : [''],
                productType: product.productType?._id || '', // Assuming productType is an object with _id
                event: Array.isArray(product.event) ? product.event.map(evt => evt._id) : [], // Assuming event is an array of objects with _id
                isFeatured: product.isFeatured || false,
                productTypeSelection: productHasVariants ? 'variants' : 'simple', // Set correct initial radio button
            };

            if (productHasVariants) {
                // Map variant images and transform attributes for the form structure
                const initialVariants = product.variants.map(v => ({
                    ...v,
                    // Transform attributes object (from backend) to array of { id, name, value } objects for the form
                    attributes: Object.entries(v.attributes || {}).map(([name, value]) => ({
                        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9), // Generate new ID for existing attributes
                        name,
                        value
                    })),
                    images: v.images.map(img => ({
                        url: img.url,
                        public_id: img.public_id,
                        previewUrl: img.url, // Use url as previewUrl for existing images
                    })),
                }));
                resetValues.variants = initialVariants;
                // Ensure simple product fields are undefined when resetting to variant
                resetValues.price = undefined;
                resetValues.stock = undefined;
                resetValues.images = undefined;
                console.log("Resetting form to variant product type with values:", resetValues);
            } else {
                // Simple product fields
                // Handle potential Mongoose Decimal128 or NumberInt types
                const parsedPrice = typeof product.price === 'object' && product.price !== null && (product.price.$numberInt || product.price.$numberDouble)
                    ? parseFloat(product.price.$numberInt || product.price.$numberDouble)
                    : product.price;
                const parsedStock = typeof product.stock === 'object' && product.stock !== null && product.stock.$numberInt
                    ? parseInt(product.stock.$numberInt, 10)
                    : product.stock;

                resetValues.price = parsedPrice || 0;
                resetValues.stock = parsedStock || 0;
                resetValues.images = Array.isArray(product.images)
                    ? product.images.map(img => ({ url: img.url, public_id: img.public_id, previewUrl: img.url }))
                    : [];
                // Ensure variant fields are undefined when resetting to simple
                resetValues.variants = undefined;
                console.log("Resetting form to simple product type with values:", resetValues);
            }
            reset(resetValues);
        } else if (isEditMode && isProductError) {
            console.error("Error fetching product data in useEffect (Edit Mode):", productError);
            toast.error("Failed to load product data. Please ensure the slug is correct.");
            navigate('/admin/products'); // Redirect on error in edit mode
        }
    }, [isEditMode, product, reset, isProductError, productError, navigate]);

    // General image handling functions for both simple products and variants
    const handleImageFileUpload = useCallback((e, variantIndex = null) => {
        const files = Array.from(e.target.files);
        console.log(`handleImageFileUpload called. Variant Index: ${variantIndex}, Files:`, files);
        if (files.length === 0) return;

        let currentImages;
        if (variantIndex !== null) {
            currentImages = control._formValues.variants?.[variantIndex]?.images || [];
        } else {
            currentImages = control._formValues.images || [];
        }
        console.log("Current images before upload:", currentImages);

        const totalImages = currentImages.length + files.length;
        const maxImages = (variantIndex !== null) ? 100 : 10; // Variants can have more images in total, adjust as needed

        if (totalImages > maxImages) {
            toast.error(`You can only upload up to ${maxImages} images for ${variantIndex !== null ? 'this variant' : 'the product'}.`);
            return;
        }

        const newImages = files.map((file) => ({
            // Generate a unique ID for each new image for React's keying
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
            file,
            previewUrl: URL.createObjectURL(file),
        }));

        if (variantIndex !== null) {
            // Use setValue to update the specific variant's images array
            const updatedVariantImages = [...currentImages, ...newImages];
            console.log(`Updating variant ${variantIndex} images to:`, updatedVariantImages);
            setValue(`variants.${variantIndex}.images`, updatedVariantImages, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        } else {
            // Use setValue to update the simple product's images array
            console.log("Updating simple product images to:", [...currentImages, ...newImages]);
            setValue('images', [...currentImages, ...newImages], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        }
    }, [control._formValues.variants, control._formValues.images, setValue]);

    const handleRemoveImage = useCallback((index, variantIndex = null) => {
        console.log(`handleRemoveImage called. Index: ${index}, Variant Index: ${variantIndex}`);
        let currentImages;
        let toRevoke;

        if (variantIndex !== null) {
            currentImages = control._formValues.variants?.[variantIndex]?.images || [];
            toRevoke = currentImages[index]?.previewUrl;
            if (toRevoke) {
                URL.revokeObjectURL(toRevoke); // Clean up object URL
                console.log("Revoked Object URL:", toRevoke);
            }

            const updatedVariantImages = [...currentImages];
            updatedVariantImages.splice(index, 1);
            console.log(`Updated variant ${variantIndex} images after removal:`, updatedVariantImages);
            setValue(`variants.${variantIndex}.images`, updatedVariantImages, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        } else {
            currentImages = control._formValues.images || [];
            toRevoke = currentImages[index]?.previewUrl;
            if (toRevoke) {
                URL.revokeObjectURL(toRevoke); // Clean up object URL
                console.log("Revoked Object URL:", toRevoke);
            }

            const updatedImages = [...currentImages];
            updatedImages.splice(index, 1);
            console.log("Updated simple product images after removal:", updatedImages);
            setValue('images', updatedImages, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        }
    }, [control._formValues.variants, control._formValues.images, setValue]);

    const handleEventSelect = (e) => {
        const selectedId = e.target.value;
        console.log("Event selected:", selectedId);
        if (!selectedId) return;

        const currentEvents = watchedEvents || [];

        if (currentEvents.includes(selectedId)) {
            toast.info('This event is already selected.');
            return;
        }

        setValue('event', [...currentEvents, selectedId], { shouldValidate: true, shouldDirty: true });
        e.target.value = ''; // Reset select input
        console.log("Updated events:", [...currentEvents, selectedId]);
    };

    const handleRemoveSelectedEvent = (eventIdToRemove) => {
        console.log("Removing event:", eventIdToRemove);
        const updatedEvents = watchedEvents.filter(id => id !== eventIdToRemove);
        setValue('event', updatedEvents, { shouldValidate: true, shouldDirty: true });
        console.log("Events after removal:", updatedEvents);
    };

    // --- Product Form Submission ---
    const onSubmit = async (data) => {
        console.log("onSubmit triggered. Form data:", data);
        setIsSubmitting(true);
        try {
            const formData = new FormData();

            // Append common product fields
            formData.append('name', data.name);
            data.description.forEach((desc, index) => {
                formData.append(`description[${index}]`, desc);
            });
            formData.append('productType', data.productType);
            formData.append('isFeatured', data.isFeatured);
            formData.append('event', JSON.stringify(data.event)); // Send array of event IDs as JSON string

            // Conditional append based on product type
            if (watchedProductTypeSelection === 'variants') {
                console.log("Submitting as variant product.");
                
                // Check if each variant has at least one image
                const variantsWithoutImages = data.variants.filter((variant, index) => {
                    // Check for existing images (with url and public_id) or new uploaded files (with file property)
                    const hasExistingImages = variant.images && variant.images.some(img => img.url && img.public_id);
                    const hasNewImages = variant.images && variant.images.some(img => img.file);
                    const hasImages = hasExistingImages || hasNewImages;
                    
                    if (!hasImages) {
                        console.error(`Variant ${index} has no images (existing: ${hasExistingImages}, new: ${hasNewImages})`);
                    }
                    return !hasImages;
                });
                
                if (variantsWithoutImages.length > 0) {
                    toast.error('Each variant must have at least one image.');
                    setIsSubmitting(false);
                    return;
                }
                
                // Handle variants data and their images
                const variantsToSubmit = data.variants.map(variant => {
                    // Transform attributes array back to object for backend
                    const attributesObject = variant.attributes.reduce((acc, attr) => {
                        if (attr.name && attr.value) { // Only include if both name and value are present
                            acc[attr.name] = attr.value;
                        }
                        return acc;
                    }, {});

                    // For edit mode, include existing images in the variant data
                    const existingImages = variant.images.filter(img => img.url && img.public_id).map(img => ({ url: img.url, public_id: img.public_id }));

                    return {
                        ...variant,
                        attributes: attributesObject, // Send as object to backend
                        // Include existing images for edit mode
                        existingImages: isEditMode ? existingImages : [],
                        // For new products, don't include images in JSON (they'll be uploaded as files)
                        images: isEditMode ? [] : variant.images.filter(img => img.url && img.public_id).map(img => ({ url: img.url, public_id: img.public_id })),
                        // Only include _id for existing variants in edit mode
                        ...(isEditMode && variant._id ? { _id: variant._id } : {}),
                    };
                });
                formData.append('variants', JSON.stringify(variantsToSubmit));
                console.log("Variants data prepared for submission:", variantsToSubmit);

                // Append new variant image files with correct field names for Multer
                let totalVariantImages = 0;
                data.variants.forEach((variant, variantIndex) => {
                    variant.images.forEach((img) => {
                        if (img.file) { // Only append new File objects
                            formData.append(`variants[${variantIndex}].images`, img.file);
                            totalVariantImages++;
                            console.log(`Appending new image file for variant ${variantIndex}:`, img.file.name);
                        }
                    });
                });
                console.log(`Total variant images being uploaded: ${totalVariantImages}`);

                // Explicitly send empty values for simple product fields to avoid backend confusion
                formData.append('price', '');
                formData.append('stock', '');
                formData.append('existingImages', JSON.stringify([]));

                // Do NOT append simple product fields for variant products
                // The backend will handle this validation
            } else { // Simple product
                console.log("Submitting as simple product.");
                // Handle simple product fields and their images
                formData.append('price', data.price);
                formData.append('stock', data.stock);

                // Existing main images (only url and public_id)
                const existingImagesData = data.images.filter(img => img.url && img.public_id);
                formData.append('existingImages', JSON.stringify(existingImagesData)); // Send as JSON string
                console.log("Existing simple product images prepared:", existingImagesData);

                // New main image files
                data.images.forEach((img) => {
                    if (img.file) { // Only append new File objects
                        formData.append('images', img.file);
                        console.log("Appending new simple product image file:", img.file.name);
                    }
                });
                // Ensure variant fields are not sent or explicitly empty for backend validation
                formData.append('variants', JSON.stringify([])); // Explicitly send empty array
            }

            console.log("Submitting product form data (check DevTools Network tab for payload)");

            if (isEditMode) {
                console.log("Calling updateProduct mutation...");
                await updateProduct({ slug: slug, formData: formData }).unwrap(); // Pass slug for update
                toast.success('Product updated successfully');
            } else {
                console.log("Calling createProduct mutation...");
                await createProduct(formData).unwrap();
                toast.success('Product created successfully');
            }
            navigate('/admin/products'); // Redirect after successful operation
        } catch (error) {
            console.error("Product submit error caught:", error);
            // Display specific backend error message if available
            console.error("Backend response data:", error?.data);
            toast.error(error?.data?.message || 'Failed to perform product operation');
        } finally {
            setIsSubmitting(false);
            console.log("Submission process finished. isSubmitting set to false.");
        }
    };

    // Combine all loading states for the main submit button
    const overallLoading = isProductLoading || isCreatingProduct || isUpdatingProduct || isSubmitting || areCategoriesLoading || areEventsLoading;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        {isEditMode ? 'Edit Product' : 'Add New Product'}
                    </h1>
                    <p className="text-gray-600">
                        {isEditMode ? 'Update product information' : 'Create a new product listing'}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/products')}
                    className="btn btn-outline flex items-center shrink-0"
                    disabled={overallLoading}
                >
                    <ArrowLeft size={18} className="mr-2" /> Back to Products
                </button>
            </div>

            {/* Main Product Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Product Type Selection */}
                    <div className="mb-6">
                        <label className="label">Product Structure:</label>
                        <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    value="simple"
                                    {...register('productTypeSelection')}
                                    checked={watchedProductTypeSelection === 'simple'}
                                    className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                                    disabled={isEditMode && !!product} // Disable changing type if product already exists
                                />
                                <span className="ml-2 text-gray-700">Simple Product</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    value="variants"
                                    {...register('productTypeSelection')}
                                    checked={watchedProductTypeSelection === 'variants'}
                                    className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                                    disabled={isEditMode && !!product} // Disable changing type if product already exists
                                />
                                <span className="ml-2 text-gray-700">Product with Variants</span>
                            </label>
                        </div>
                        {errors.productTypeSelection && ( // Display error for the selection itself if any
                             <p className="error-message mt-2">{errors.productTypeSelection.message}</p>
                        )}
                        {isEditMode && product && (
                            <p className="text-sm text-gray-500 mt-2">
                                Note: Product type cannot be changed after creation.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Common Product Information */}
                        <div>
                            <h2 className="text-xl font-bold mb-6 text-gray-800">Product Details</h2>
                            <div className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="label">
                                        Product Name <span className="text-error-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        className={`input ${errors.name ? 'border-error-500' : ''}`}
                                        {...register('name')}
                                    />
                                    {errors.name && (
                                        <p className="error-message">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="label">
                                        Description <span className="text-error-500">*</span>
                                    </label>
                                    {descriptionFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2 mb-2">
                                            <input
                                                type="text"
                                                className={`input w-full ${errors.description?.[index] ? 'border-error-500' : ''}`}
                                                {...register(`description.${index}`)}
                                                placeholder={`Description point ${index + 1}`}
                                            />
                                            {index === descriptionFields.length - 1 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => appendDescription('')}
                                                    className="p-2 rounded-md bg-green-100 hover:bg-green-200 text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => removeDescription(index)}
                                                    className="p-2 rounded-md bg-red-100 hover:bg-red-200 text-red-600 focus:outline-none focus:ring-2"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {errors.description && (
                                        <p className="error-message text-sm text-error-500 mt-1">
                                            {errors.description.message}
                                        </p>
                                    )}
                                </div>

                                {/* Product Type (Category) Dropdown */}
                                <div>
                                    <label htmlFor="productType" className="label">
                                        Product Type <span className="text-error-500">*</span>
                                    </label>
                                    <select
                                        id="productType"
                                        className={`input ${errors.productType ? 'border-error-500' : ''}`}
                                        {...register('productType')}
                                        disabled={areCategoriesLoading} // Disable while loading
                                    >
                                        <option value="">Select a Product Type</option>
                                        {areCategoriesLoading ? (
                                            <option disabled>Loading types...</option>
                                        ) : categoriesError ? (
                                            <option disabled className="text-red-500">Error loading types</option>
                                        ) : categories?.length === 0 ? (
                                            <option disabled>No product types available</option>
                                        ) : (
                                            categories.map((cat) => (
                                                <option key={cat._id} value={cat._id}>
                                                    {cat.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {errors.productType && (
                                        <p className="error-message">{errors.productType.message}</p>
                                    )}
                                </div>

                                {/* Event Selector (Dropdown + Chips) */}
                                <div>
                                    <label htmlFor="eventSelector" className="label">
                                        Events (Max 10) <span className="text-error-500">*</span>
                                    </label>
                                    <select
                                        id="eventSelector"
                                        className={`input ${errors.event ? 'border-error-500' : ''} ${watchedEvents.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onChange={handleEventSelect}
                                        value="" // Controlled select, value should be empty string for placeholder
                                        disabled={areEventsLoading || watchedEvents.length >= 10} // Disable while loading or when limit reached
                                    >
                                        <option value="">
                                            {watchedEvents.length >= 10 
                                                ? 'Maximum 10 events reached' 
                                                : 'Select an Event'
                                            }
                                        </option>
                                        {areEventsLoading ? (
                                            <option disabled>Loading events...</option>
                                        ) : eventsError ? (
                                            <option disabled className="text-red-500">Error loading events</option>
                                        ) : events?.length === 0 ? (
                                            <option disabled>No Events available</option>
                                        ) : (
                                            events?.map((evt) => (
                                                // Only show events not already selected
                                                !watchedEvents.includes(evt._id) && (
                                                    <option key={evt._id} value={evt._id}>
                                                        {evt.name}
                                                    </option>
                                                )
                                            ))
                                        )}
                                    </select>
                                    {errors.event && (
                                        <p className="error-message">{errors.event.message}</p>
                                    )}

                                    {/* Selected Event Chips */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {watchedEvents.length === 0 && (
                                            <p className="text-gray-500 text-sm">No events selected.</p>
                                        )}
                                        {watchedEvents.map((eventId) => {
                                            // Find event name from fetched events data
                                            const eventName = events?.find(evt => evt._id === eventId)?.name || 'Unknown Event';
                                            return (
                                                <span key={eventId} className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {eventName}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSelectedEvent(eventId)}
                                                        className="ml-2 text-primary-600 hover:text-primary-900 focus:outline-none"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                    {watchedEvents.length >= 10 && (
                                        <p className="text-sm text-amber-600 mt-2">
                                            Maximum of 10 events reached. Remove some events to add more.
                                        </p>
                                    )}
                                </div>

                                {/* Featured Checkbox */}
                                <div className="flex items-center">
                                    <input
                                        id="isFeatured"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                                        {...register('isFeatured')}
                                    />
                                    <label htmlFor="isFeatured" className="ml-2 text-gray-700">
                                        Featured Product
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Conditional Fields: Simple Product vs. Variants */}
                        {watchedProductTypeSelection === 'variants' ? (
                            /* --- Variant Product Fields --- */
                            <div>
                                <h2 className="text-xl font-bold mb-6 text-gray-800">Product Variants</h2>
                                {errors.variants && (
                                    <p className="error-message mb-4">{errors.variants.message}</p>
                                )}
                                <div className="space-y-8">
                                    {/* *** ADDED GUARD HERE *** */}
                                    {Array.isArray(variantFields) && variantFields.length > 0 ? (
                                        variantFields.map((variantField, variantIndex) => {
                                            console.log(`Rendering Variant ${variantIndex}. ID: ${variantField.id}`, variantField);
                                            return (
                                                <div key={variantField.id} className="p-4 border rounded-lg bg-gray-50 relative">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="font-semibold">Variant {variantIndex + 1}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleVariantCollapse(variantField.id)}
                                                                className="p-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
                                                                aria-label={collapsedVariantIds.has(variantField.id) ? 'Expand variant' : 'Collapse variant'}
                                                                title={collapsedVariantIds.has(variantField.id) ? 'Expand' : 'Collapse'}
                                                            >
                                                                {collapsedVariantIds.has(variantField.id) ? (
                                                                    <ChevronRight size={16} />
                                                                ) : (
                                                                    <ChevronDown size={16} />
                                                                )}
                                                            </button>
                                                            {variantFields.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        console.log(`Removing variant at index: ${variantIndex}`);
                                                                        removeVariant(variantIndex);
                                                                    }}
                                                                    className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!collapsedVariantIds.has(variantField.id) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* SKU */}
                                                        <div>
                                                            <label htmlFor={`variants.${variantIndex}.sku`} className="label">Generated SKU</label>
                                                            <input
                                                                type="text"
                                                                id={`variants.${variantIndex}.sku`}
                                                                className="input bg-gray-100 cursor-not-allowed"
                                                                {...register(`variants.${variantIndex}.sku`)}
                                                                readOnly // Made read-only
                                                                disabled={true} // Visually indicate disabled
                                                            />
                                                            {/* No error message for SKU as it's auto-generated and derived */}
                                                        </div>
 
                                                        {/* Variant Price */}
                                                        <div>
                                                            <label htmlFor={`variants.${variantIndex}.price`} className="label">Price (₹) <span className="text-error-500">*</span></label>
                                                            <input
                                                                type="number"
                                                                id={`variants.${variantIndex}.price`}
                                                                step="0.01"
                                                                className={`input ${errors.variants?.[variantIndex]?.price ? 'border-error-500' : ''}`}
                                                                {...register(`variants.${variantIndex}.price`, { valueAsNumber: true })}
                                                                min="0.01"
                                                            />
                                                            {errors.variants?.[variantIndex]?.price && (
                                                                <p className="error-message">{errors.variants[variantIndex].price.message}</p>
                                                            )}
                                                        </div>

                                                        {/* Variant Stock */}
                                                        <div>
                                                            <label htmlFor={`variants.${variantIndex}.stock`} className="label">Stock <span className="text-error-500">*</span></label>
                                                            <input
                                                                type="number"
                                                                id={`variants.${variantIndex}.stock`}
                                                                className={`input ${errors.variants?.[variantIndex]?.stock ? 'border-error-500' : ''}`}
                                                                {...register(`variants.${variantIndex}.stock`, { valueAsNumber: true })}
                                                                min="0"
                                                            />
                                                            {errors.variants?.[variantIndex]?.stock && (
                                                                <p className="error-message">{errors.variants[variantIndex].stock.message}</p>
                                                            )}
                                                        </div>

                                                        {/* Attributes (e.g., Color, Size) */}
                                                        <div>
                                                            <label className="label">Attributes (e.g., color: Red, size: M)</label>
                                                            <div className="space-y-2">
                                                                {watchedVariants[variantIndex].attributes.map((attribute, attrIndex) => (
                                                                    <div key={attribute.id || attrIndex} className="flex gap-2 items-center">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Attribute Name"
                                                                            className={`input w-1/2 ${errors.variants?.[variantIndex]?.attributes?.[attrIndex]?.name ? 'border-error-500' : ''}`}
                                                                            {...register(`variants.${variantIndex}.attributes.${attrIndex}.name`)}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Attribute Value"
                                                                            className={`input w-1/2 ${errors.variants?.[variantIndex]?.attributes?.[attrIndex]?.value ? 'border-error-500' : ''}`}
                                                                            {...register(`variants.${variantIndex}.attributes.${attrIndex}.value`)}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeAttributeFromVariant(variantIndex, attrIndex)}
                                                                            className="p-1 rounded-md text-red-600 hover:bg-red-100"
                                                                        >
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addAttributeToVariant(variantIndex)}
                                                                    className="btn btn-sm btn-outline flex items-center gap-1 mt-2"
                                                                >
                                                                    <Plus size={16} /> Add Attribute
                                                                </button>
                                                            </div>
                                                            {errors.variants?.[variantIndex]?.attributes && (
                                                                <p className="error-message mt-2">{errors.variants[variantIndex].attributes.message}</p>
                                                            )}
                                                        </div>

                                                        {/* Variant Images */}
                                                        <div>
                                                            <label className="label">Variant Images <span className="text-error-500">*</span></label>
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => document.getElementById(`variantImageUpload-${variantIndex}`)?.click()}
                                                                    className="btn btn-sm btn-primary flex items-center gap-2"
                                                                >
                                                                    <Upload size={16} /> Upload
                                                                </button>
                                                                <input
                                                                    id={`variantImageUpload-${variantIndex}`}
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*"
                                                                    onChange={(e) => handleImageFileUpload(e, variantIndex)}
                                                                    className="hidden"
                                                                />
                                                            </div>
                                                            {errors.variants?.[variantIndex]?.images && (
                                                                <p className="error-message mb-2">{errors.variants[variantIndex].images.message}</p>
                                                            )}
                                                            <Controller
                                                                name={`variants.${variantIndex}.images`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                                        {/* Ensure stable key for image elements too */}
                                                                        {field.value.map((image, imgIndex) => (
                                                                            <div key={image.id || imgIndex} className="relative group aspect-w-1 aspect-h-1 rounded-md overflow-hidden">
                                                                                <img
                                                                                    src={image.previewUrl || image.url}
                                                                                    alt={`Variant ${variantIndex} Image ${imgIndex}`}
                                                                                    className="object-cover w-full h-full"
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveImage(imgIndex, variantIndex)}
                                                                                    className="absolute top-2 right-2 bg-error-500 text-white rounded-full p-1"
                                                                                >
                                                                                    <X size={12} />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                        {field.value.length === 0 && (
                                                                            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center col-span-2">
                                                                                <Image size={24} className="mx-auto text-gray-400 mb-1" />
                                                                                <p className="text-gray-500 text-xs">No variant images</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-500 text-center mt-4">No variants added yet. Click "Add New Variant" to start.</p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            const newVariantId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
                                            const newAttributeId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
                                            console.log(`Appending new variant. ID: ${newVariantId}`);
                                            
                                            // Get current variants to determine the new variant index
                                            const currentVariants = watch('variants') || [];
                                            const newVariantIndex = currentVariants.length;
                                            
                                            // Generate initial SKU for the new variant
                                            const initialSku = generateSku(watchedName || 'Product', [], newVariantIndex);
                                            
                                            appendVariant({
                                                id: newVariantId, // Unique ID for new variant
                                                sku: initialSku, // Generate initial SKU immediately
                                                attributes: [{ id: newAttributeId, name: '', value: '' }], // Unique ID for new attribute
                                                price: 0,
                                                stock: 0,
                                                images: [], // New variants start with no images
                                            });
                                            
                                            // Small delay to ensure form state is updated before SKU generation effect runs
                                            setTimeout(() => {
                                                // Trigger SKU generation for the new variant
                                                const updatedVariants = watch('variants');
                                                if (updatedVariants && updatedVariants[newVariantIndex]) {
                                                    const variant = updatedVariants[newVariantIndex];
                                                    const hasValidAttributes = variant.attributes && 
                                                        Array.isArray(variant.attributes) && 
                                                        variant.attributes.length > 0 && 
                                                        variant.attributes.some(attr => attr.name && attr.value);
                                                    
                                                    if (hasValidAttributes) {
                                                        const newSku = generateSku(watchedName || 'Product', variant.attributes, newVariantIndex);
                                                        setValue(`variants.${newVariantIndex}.sku`, newSku, { shouldDirty: true });
                                                    }
                                                }
                                            }, 100);
                                            
                                            // Blur the button to remove focus
                                            e.target.blur();
                                        }}
                                        className="btn btn-outline flex items-center gap-2 mt-4 w-full justify-center"
                                    >
                                        <Plus size={18} /> Add New Variant
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* --- Simple Product Fields --- */
                            <div>
                                <h2 className="text-xl font-bold mb-6 text-gray-800">Simple Product Details</h2>
                                <div className="space-y-6">
                                    {/* Price */}
                                    <div>
                                        <label htmlFor="price" className="label">
                                            Price (₹) <span className="text-error-500">*</span>
                                        </label>
                                        <input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            className={`input ${errors.price ? 'border-error-500' : ''}`}
                                            {...register('price', { valueAsNumber: true })}
                                            min="0" // Ensure non-negative input
                                        />
                                        {errors.price && (
                                            <p className="error-message">{errors.price.message}</p>
                                        )}
                                    </div>

                                    {/* Stock Quantity */}
                                    <div>
                                        <label htmlFor="stock" className="label">
                                            Stock Quantity <span className="text-error-500">*</span>
                                        </label>
                                        <input
                                            id="stock"
                                            type="number"
                                            min="0"
                                            className={`input ${errors.stock ? 'border-error-500' : ''}`}
                                            {...register('stock', { valueAsNumber: true })}
                                        />
                                        {errors.stock && (
                                            <p className="error-message">{errors.stock.message}</p>
                                        )}
                                    </div>

                                    {/* Product Images (for simple products) */}
                                    <div>
                                        <label className="label">Upload Images <span className="text-error-500">*</span></label>
                                        <div className="flex items-center gap-4 mb-2">
                                            <button
                                                type="button"
                                                disabled={(watch('images') || []).length >= 10}
                                                onClick={() => document.getElementById('simpleImageUploadInput')?.click()}
                                                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Upload size={18} />
                                                Upload from device
                                            </button>
                                            <input
                                                id="simpleImageUploadInput"
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => handleImageFileUpload(e)}
                                                className="hidden"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Only images (max 10)</p>
                                        {errors.images && (
                                            <p className="error-message mb-2">{errors.images.message}</p>
                                        )}
                                        <Controller
                                            name="images"
                                            control={control}
                                            render={({ field }) => (
                                                <div>
                                                    {field.value.length === 0 ? (
                                                        <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                                                            <Image size={32} className="mx-auto text-gray-400 mb-2" />
                                                            <p className="text-gray-500">No images uploaded yet</p>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                            {field.value.map((image, index) => (
                                                                <div key={image.id || index} className="relative group">
                                                                    <div className="aspect-w-1 aspect-h-1 rounded-md overflow-hidden bg-gray-100">
                                                                        <img
                                                                            src={image.previewUrl || image.url}
                                                                            alt={`Uploaded image ${index + 1}`}
                                                                            className="object-cover w-full h-full"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveImage(index)}
                                                                            className="absolute top-2 right-2 bg-error-500 text-white rounded-full p-1 transition-opacity"
                                                                            >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div> {/* <-- This div closes the grid-cols-2 for common/conditional fields */}

                    {/* Form Actions */}
                    <div className="mt-8 pt-8 border-t border-gray-200 flex justify-end">
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/products')}
                                className="btn btn-outline"
                                disabled={overallLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary flex items-center"
                                disabled={overallLoading}
                            >
                                {overallLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} className="mr-2" />
                                        {isEditMode ? 'Update Product' : 'Create Product'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form> {/* <-- This closes the form element */}
            </div> {/* <-- This closes the div with bg-white, shadow-md etc. */}
        </div> // <-- This closes the main container div
    );
};

export default AdminProductFormPage;