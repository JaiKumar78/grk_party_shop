// src/store/api/storesApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '../../config/api'; // Assuming apiBaseUrl is defined here

export const storesApi = createApi({
  reducerPath: 'storesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      // Assuming you have an adminAuth slice for admin actions
      const token = getState().adminAuth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Stores'], // Tag type for invalidation
  endpoints: (builder) => ({
    // Query to get all stores (publicly accessible)
    getAllStores: builder.query({
      query: () => 'api/stores',
      providesTags: ['Stores'], // Provides the 'Stores' tag to invalidate
    }),
    // Query to get a single store by ID (publicly accessible)
    getStoreById: builder.query({
      query: (id) => `api/stores/${id}`,
      providesTags: (result, error, id) => [{ type: 'Stores', id }],
    }),
    // Mutation to create a new store (Admin only)
    createStore: builder.mutation({
      query: (storeData) => ({
        url: 'api/stores',
        method: 'POST',
        body: storeData,
      }),
      invalidatesTags: ['Stores'], // Invalidate 'Stores' cache after creation
    }),
    // Mutation to update an existing store (Admin only)
    updateStore: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `api/stores/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Stores', id }],
    }),
    // Mutation to delete a store (Admin only)
    deleteStore: builder.mutation({
      query: (id) => ({
        url: `api/stores/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Stores'], // Invalidate 'Stores' cache after deletion
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetAllStoresQuery,
  useGetStoreByIdQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoreMutation,
} = storesApi;
