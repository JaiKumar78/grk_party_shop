import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '../../config/api'; // Assuming apiBaseUrl is defined here

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      // Get the user token from your Redux auth slice
      const token = getState().userAuth?.token; // Assuming userAuth slice stores the token
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Reviews', 'Product'], // 'Reviews' for review lists, 'Product' to trigger product rating refetch
  endpoints: (builder) => ({
    // Query to get all reviews for a specific product
    getReviewsForProduct: builder.query({
      query: (productId) => `api/reviews/${productId}`,
      providesTags: (result, error, productId) => [{ type: 'Reviews', id: productId }],
    }),
    // Mutation to create a new review
    createReview: builder.mutation({
      query: (reviewData) => ({ // reviewData: { productId, rating, comment }
        url: 'api/reviews',
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Reviews', id: productId }, // Invalidate reviews for this product
        { type: 'Product', id: productId }, // Invalidate the single product to re-fetch updated ratings
      ],
    }),
    // Mutation to update an existing review
    updateReview: builder.mutation({
      query: ({ reviewId, ...patch }) => ({ // patch: { rating, comment }
        url: `api/reviews/${reviewId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: 'Reviews', id: result?.review?.product }, // Invalidate reviews for the product
        { type: 'Product', id: result?.review?.product }, // Invalidate the single product to re-fetch updated ratings
      ],
      // Note: If result.review.product is not available, you might need to pass productId as a separate argument.
      // E.g., query: ({ reviewId, productId, ...patch }) and then invalidatesTags: [{ type: 'Reviews', id: productId }, { type: 'Product', id: productId }]
    }),
    // Mutation to delete a review
    deleteReview: builder.mutation({
      query: (reviewId) => ({
        url: `api/reviews/${reviewId}`,
        method: 'DELETE',
      }),
      // Assuming you get the product ID from the result or pass it as an argument
      invalidatesTags: (result, error, reviewId) => [
        { type: 'Reviews', id: result?.review?.product || 'LIST' }, // Invalidate reviews for the product
        { type: 'Product', id: result?.review?.product || 'LIST' }, // Invalidate the single product to re-fetch updated ratings
      ],
      // Note: Similar to updateReview, ensure productId is available for invalidation
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetReviewsForProductQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = reviewsApi;
