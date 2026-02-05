// store/api/eventsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '../../config/api'; // Assuming apiBaseUrl is defined here

export const eventsApi = createApi({
  reducerPath: 'eventsApi',
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
  tagTypes: ['Event'], // Use singular for consistency
  endpoints: (builder) => ({
    // Query to get all events
    getAllEvents: builder.query({
      query: () => 'api/events',
      providesTags: ['Event'],
    }),
    // Query to get a single event by ID or slug
    getEventByIdOrSlug: builder.query({
      query: (idOrSlug) => `api/events/${idOrSlug}`,
      providesTags: (result, error, idOrSlug) => [{ type: 'Event', id: idOrSlug }],
    }),
    // Mutation to create a new event
    createEvent: builder.mutation({
      query: (formData) => ({
        url: 'api/events',
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, browser will set it for FormData
      }),
      invalidatesTags: ['Event'],
    }),
    // Mutation to update an existing event
    updateEvent: builder.mutation({
      query: ({ id, formData }) => ({
        url: `api/events/${id}`,
        method: 'PUT',
        body: formData,
        // Don't set Content-Type header, browser will set it for FormData
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Event', id }], // Invalidate specific event and all events
    }),
    // Mutation to delete an event
    deleteEvent: builder.mutation({
      query: (id) => ({
        url: `api/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Event'], // Invalidate specific event and all events
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetAllEventsQuery,
  useGetEventByIdOrSlugQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventsApi;