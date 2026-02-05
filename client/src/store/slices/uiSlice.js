import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isMobileMenuOpen: false,
  isSidebarOpen: true,
  searchQuery: '',
  activeFilters: {
    category: [],
    priceRange: null,
    sortBy: 'newest',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setCategoryFilter: (state, action) => {
      state.activeFilters.category = action.payload;
    },
    setPriceRangeFilter: (state, action) => {
      state.activeFilters.priceRange = action.payload;
    },
    setSortBy: (state, action) => {
      state.activeFilters.sortBy = action.payload;
    },
    clearFilters: (state) => {
      state.activeFilters = {
        category: [],
        priceRange: null,
        sortBy: 'newest',
      };
    },
  },
});

export const {
  toggleMobileMenu,
  toggleSidebar,
  setSearchQuery,
  setCategoryFilter,
  setPriceRangeFilter,
  setSortBy,
  clearFilters,
} = uiSlice.actions;

export default uiSlice.reducer;