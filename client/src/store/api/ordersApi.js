import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '../../config/api';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
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
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    getAllOrders: builder.query({
      query: (params = {}) => ({
        url: 'api/payment/orders',
        params,
      }),
      providesTags: ['Orders'],
    }),
    getMyOrders: builder.query({
      query: () => 'api/payment/myorders', // User only
      providesTags: ['Orders'],
    }),
    getOrderById: builder.query({
      query: (orderId) => `api/payment/orders/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Orders', id: orderId }],
    }),
    getUserDataByEmail: builder.query({
      query: (email) => `api/user/data/${email}`,
      providesTags: ['UserData'],
    }),
    getUserDataByPhone: builder.query({
      query: (mobileNo) => `api/user/data/phone/${mobileNo}`,
      providesTags: ['UserData'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ orderId, newStatus }) => ({
        url: `api/payment/orders/${orderId}/status`,
        method: 'PUT',
        body: { newStatus },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        'Orders',
        { type: 'Orders', id: orderId },
      ],
    }),
  }),
});

export const {
  useGetAllOrdersQuery,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useGetUserDataByEmailQuery,
  useGetUserDataByPhoneQuery,
  useUpdateOrderStatusMutation,
} = ordersApi; 