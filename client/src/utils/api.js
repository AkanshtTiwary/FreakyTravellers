/**
 * API Utility
 * Centralized Axios configuration for API calls
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !=='undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      
      // Return full error data object (not just message) so we can access error type
      return Promise.reject(data || { message: 'An error occurred' });
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({ message: 'Network error. Please check your connection.' });
    } else {
      // Something else happened
      return Promise.reject({ message: error.message || 'An unexpected error occurred' });
    }
  }
);

export default api;

// ==================== AUTH APIs ====================

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (credential) => api.post('/auth/google', { credential }),
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  loginWithOTP: (data) => api.post('/auth/login-with-otp', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
};

// ==================== TRIP APIs ====================

export const tripAPI = {
  optimizeTrip: (data) => api.post('/trips/optimize', data),
  getTripById: (id) => api.get(`/trips/${id}`),
  getMyTrips: (params) => api.get('/trips/my-trips', { params }),
  getAllTrips: (params) => api.get('/trips', { params }),
  updateTripStatus: (id, status) => api.put(`/trips/${id}/status`, { status }),
  deleteTrip: (id) => api.delete(`/trips/${id}`),
  getTripStats: () => api.get('/trips/stats'),
  getPopularDestinations: () => api.get('/trips/popular-destinations'),
};

// ==================== PAYMENT APIs ====================

export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify-payment', data),
  paymentFailed: (data) => api.post('/payments/payment-failed', data),
  getBookingById: (id) => api.get(`/payments/bookings/${id}`),
  getMyBookings: (params) => api.get('/payments/my-bookings', { params }),
  getAllBookings: (params) => api.get('/payments/bookings', { params }),
  cancelBooking: (id, reason) => api.post(`/payments/bookings/${id}/cancel`, { reason }),
  getBookingStats: () => api.get('/payments/stats'),
};
