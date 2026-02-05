// store/api/categoriesApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '../../config/api'; // Assuming apiBaseUrl is defined here

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
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
  tagTypes: ['Category'], // Use singular for consistency
  endpoints: (builder) => ({
    // Query to get all categories
    getAllCategories: builder.query({
      query: () => 'api/categories',
      providesTags: ['Category'],
    }),
    // Query to get a single category by ID or slug
    getCategoryByIdOrSlug: builder.query({
      query: (idOrSlug) => `api/categories/${idOrSlug}`,
      providesTags: (result, error, idOrSlug) => [{ type: 'Category', id: idOrSlug }],
    }),
    // Mutation to create a new category
    createCategory: builder.mutation({
      query: (formData) => ({
        url: 'api/categories',
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, browser will set it for FormData
      }),
      invalidatesTags: ['Category'],
    }),
    // Mutation to update an existing category
    updateCategory: builder.mutation({
      query: ({ id, formData }) => ({
        url: `api/categories/${id}`,
        method: 'PUT',
        body: formData,
        // Don't set Content-Type header, browser will set it for FormData
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Category', id }], // Invalidate specific category and all category
    }),
    // Mutation to delete a category
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `api/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'], // Invalidate specific category and all category
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetAllCategoriesQuery,
  useGetCategoryByIdOrSlugQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
