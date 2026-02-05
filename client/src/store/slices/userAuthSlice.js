// src/store/slices/userAuthSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { apiBaseUrl } from '../../config/api';
import { clearLocalStorageCart } from '../../utils/cartPersistence';

// Check token expiration on initial load
const profileFromStorage = localStorage.getItem('profile')
  ? JSON.parse(localStorage.getItem('profile'))
  : null;

let user = null;
let token = null;
let isAuthenticated = false;

if (profileFromStorage?.token) {
  try {
    const decoded = jwtDecode(profileFromStorage.token);
    const isExpired = decoded.exp * 1000 < Date.now();

    if (!isExpired) {
      user = profileFromStorage.user;
      token = profileFromStorage.token;
      isAuthenticated = true;
    } else {
      localStorage.removeItem('profile'); // Cleanup expired token
    }
  } catch (error) {
    // Invalid token format or other decoding error
    console.error("Error decoding JWT from storage:", error);
    localStorage.removeItem('profile');
  }
}

const initialState = {
  user,
  token,
  isAuthenticated,
  loading: false,
  error: null,
  otpSent: false, // NEW: State to track if OTP has been sent
};

// NEW: Async Thunk for sending OTP to email
export const sendOtpEmail = createAsyncThunk(
  'user/sendOtpEmail',
  async ({ email }, { rejectWithValue }) => {
    try {
      // Call your backend's send-otp endpoint
      const { data } = await axios.post(`${apiBaseUrl}/api/user/send-otp`, { email });
      return data; // This might just return a success message
    } catch (error) {
      console.error("Error sending OTP email:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to send OTP.');
    }
  }
);

// NEW: Async Thunk for verifying OTP and logging in/registering
export const verifyOtp = createAsyncThunk(
  'user/verifyOtp',
  async ({ email, otp, name }, { rejectWithValue }) => {
    try {
      // Call your backend's verify-otp endpoint
      // 'name' is included in case it's a new user registration via OTP
      const { data } = await axios.post(`${apiBaseUrl}/api/user/verify-otp`, { email, otp, name });
      return data; // Should return user data and token
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return rejectWithValue(error.response?.data?.message || 'OTP verification failed.');
    }
  }
);

// fetchUserProfile is largely unchanged, it still uses the JWT
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { userAuth } = getState(); // Correctly access the slice state
      if (!userAuth.token) {
        return rejectWithValue('No token found for fetching profile.');
      }
      const { data } = await axios.get(`${apiBaseUrl}/users/profile`, {
        headers: { Authorization: `Bearer ${userAuth.token}` },
      });
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return rejectWithValue(error.response?.data?.message || 'Fetching profile failed');
    }
  }
);


const persistToLocalStorage = (user, token) => {
  localStorage.setItem('profile', JSON.stringify({ user, token }));
};

const userAuthSlice = createSlice({
  name: 'userAuth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.otpSent = false; // Reset OTP state on logout
      localStorage.removeItem('profile');
      // Clear cart on logout
      clearLocalStorageCart();
    },
    clearError: (state) => {
      state.error = null;
    },
    // NEW: Reducer to manually set otpSent state if needed (e.g., after a successful sendOtpEmail)
    setOtpSent: (state, action) => {
      state.otpSent = action.payload;
    },
    // NEW: Reducer to clear all auth-related states (useful for complete reset)
    resetAuthStatus: (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.otpSent = false;
        localStorage.removeItem('profile');
    },
    // NEW: Reducer to update user data
    updateUserData: (state, action) => {
        state.user = { ...state.user, ...action.payload };
        // Update localStorage
        const profile = JSON.parse(localStorage.getItem('profile') || '{}');
        profile.user = { ...profile.user, ...action.payload };
        localStorage.setItem('profile', JSON.stringify(profile));
    }
  },
  extraReducers: (builder) => {
    builder
      // sendOtpEmail
      .addCase(sendOtpEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.otpSent = false; // Ensure it's false until success
      })
      .addCase(sendOtpEmail.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true; // Mark OTP as sent on success
        state.error = null; // Clear any previous errors
      })
      .addCase(sendOtpEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.otpSent = false; // OTP send failed
      })

      // verifyOtp (this handles both login and new user registration flow from the frontend perspective)
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        const { user, token } = action.payload;
        state.loading = false;
        state.user = user;
        state.token = token;
        state.isAuthenticated = true;
        state.otpSent = false; // Reset otpSent state after successful login/reg
        persistToLocalStorage(user, token);
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Profile (unchanged core logic, but ensures state is consistent)
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear error on new fetch attempt
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.isAuthenticated = true; // Confirm authenticated if profile fetched
        // Note: token is already in state, just update user and persist
        persistToLocalStorage(action.payload, state.token);
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
        state.isAuthenticated = false; // If profile fetch fails, likely not authenticated
        state.user = null;
        state.token = null;
        localStorage.removeItem('profile'); // Clear potentially invalid token
      });
  },
});

export const { logout, clearError, setOtpSent, resetAuthStatus, updateUserData } = userAuthSlice.actions;
export default userAuthSlice.reducer;
