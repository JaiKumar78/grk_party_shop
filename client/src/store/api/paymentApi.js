import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '../../config/api';

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
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
  tagTypes: ['Payment'],
  endpoints: (builder) => ({
    processPayment: builder.mutation({
      query: (payload) => ({
        url: 'api/payment/process-payment',
        method: 'POST',
        body: payload,
      }),
    }),
  }),
});

export const {
  useProcessPaymentMutation,
} = paymentApi; 