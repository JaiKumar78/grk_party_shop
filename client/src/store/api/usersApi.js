import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '../../config/api';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      // Always prefer admin token if present, otherwise use user token
      const adminToken = getState().adminAuth?.token;
      const userToken = getState().userAuth?.token;
      if (adminToken) {
        headers.set('Authorization', `Bearer ${adminToken}`);
      } else if (userToken) {
        headers.set('Authorization', `Bearer ${userToken}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => 'api/user',
      providesTags: ['Users'],
    }),
    updateUser: builder.mutation({
      query: ({ userId, userData }) => ({
        url: `api/user/${userId}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['Users'],
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `api/user/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi; 