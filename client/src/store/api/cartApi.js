import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '../../config/api'; // Assuming apiBaseUrl is defined here

export const cartApi = createApi({
  reducerPath: 'cartApi',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      // Get the user token from your Redux auth slice
      const token = getState().userAuth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Cart'], // Define a tag type for the cart
  endpoints: (builder) => ({
    // Query to get the logged-in user's cart from the backend
    getUserCart: builder.query({
      query: () => 'api/cart',
      providesTags: ['Cart'], // Provides the 'Cart' tag to invalidate
    }),
    // Mutation to update/sync the logged-in user's cart on the backend
    updateUserCart: builder.mutation({
      query: (cartItems) => ({ // cartItems expected to be an array of { product: product_id, variantId, attributes, quantity: number }
        url: 'api/cart',
        method: 'PUT',
        body: { cartItems }, // Backend expects { cartItems: [...] }
      }),
      invalidatesTags: ['Cart'], // Invalidate the 'Cart' cache after update
    }),
    // Mutation to clear the logged-in user's cart on the backend
    clearUserCart: builder.mutation({
      query: () => ({
        url: 'api/cart',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'], // Invalidate the 'Cart' cache after clearing
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetUserCartQuery,
  useUpdateUserCartMutation,
  useClearUserCartMutation,
} = cartApi;
