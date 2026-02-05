// store/api/productsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '../../config/api';

export const productsApi = createApi({
    reducerPath: 'productsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: apiBaseUrl,
        prepareHeaders: (headers, { getState }) => {
            const token = getState().adminAuth?.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Products'],
    endpoints: (builder) => ({
        getProducts: builder.query({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params?.searchTerm) {
                    queryParams.append('search', params.searchTerm);
                }
                if (params?.productType) {
                    queryParams.append('productType', params.productType);
                }
                if (params?.event) {
                    queryParams.append('event', params.event);
                }
                if (params?.stockStatus) {
                    queryParams.append('stockStatus', params.stockStatus);
                }
                if (params?.sortBy) {
                    queryParams.append('sortBy', params.sortBy);
                }
                if (params?.isFeatured !== undefined) {
                    queryParams.append('isFeatured', params.isFeatured);
                }
                const queryString = queryParams.toString();
                return `api/product/?${queryString}`;
            },
            providesTags: ['Products'],
        }),
        // Renamed from getProductBySlug to getProductByIdOrSlug
        getProductByIdOrSlug: builder.query({
            query: (identifier) => `api/product/${identifier}`, // Pass the identifier (ID or slug)
            // Adjust providesTags to use 'identifier' for invalidation/re-fetching
            providesTags: (result, error, identifier) => [{ type: 'Products', id: identifier }], 
        }),
        createProduct: builder.mutation({
            query: (formData) => ({
                url: 'api/product',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Products'],
        }),
        updateProduct: builder.mutation({
            query: ({ slug, formData }) => ({ // Still uses 'slug' for PUT
                url: `api/product/${slug}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: (result, error, { slug }) => {
                return ['Products', { type: 'Products', id: slug }, { type: 'Products', id: result?.slug }];
            },
        }),
        deleteProduct: builder.mutation({
            query: (slug) => ({ // Still uses 'slug' for DELETE
                url: `api/product/${slug}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, slug) => ['Products', { type: 'Products', id: slug }],
        }),
    }),
});

export const {
    useGetProductsQuery,
    useGetProductByIdOrSlugQuery, // Changed hook name here
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productsApi;
