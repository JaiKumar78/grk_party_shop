// src/store/slices/adminAuthSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { apiBaseUrl } from '../../config/api';
import { clearLocalStorageCart } from '../../utils/cartPersistence';

// Check token expiration
const adminDataFromStorage = localStorage.getItem('admin')
  ? JSON.parse(localStorage.getItem('admin'))
  : null;

let admin = null;
let token = null;
let isAuthenticated = false;

if (adminDataFromStorage?.token) {
  try {
    const decoded = jwtDecode(adminDataFromStorage.token);
    const isExpired = decoded.exp * 1000 < Date.now();

    if (!isExpired) {
      admin = adminDataFromStorage.admin;
      token = adminDataFromStorage.token;
      isAuthenticated = true;
    } else {
      localStorage.removeItem('admin'); // Cleanup expired token
    }
  } catch (error) {
    // Invalid token format
    localStorage.removeItem('admin');
  }
}

const initialState = {
  admin,
  token,
  isAuthenticated,
  loading: false,
  error: null,
};

export const adminLogin = createAsyncThunk(
  'admin/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${apiBaseUrl}/api/admin/login`, { email, password });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Admin login failed');
    }
  }
);

// Persist helper function
const persistAdminData = (admin, token) => {
  localStorage.setItem('admin', JSON.stringify({ admin, token }));
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    logout: (state) => {
      state.admin = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('admin');
      // Clear cart on logout
      clearLocalStorageCart();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        const { user, token } = action.payload;
        state.admin = user;
        state.token = token;
        state.isAuthenticated = true;
        state.loading = false;
        persistAdminData(user, token);
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;