import axios from 'axios';

import { showToast } from '../components/Toast';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    let message = 'An unexpected error occurred';

    if (data && data.message) {
      message = data.message;
    } else if (error.message) {
      message = error.message;
    }

    if (status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('neurofleetx_user');
      window.location.href = '/login'; // Changed from '/' to '/login' for clarity
      showToast('Session expired. Please login again.', 'warning');
    } else if (status === 403) {
      showToast('You do not have permission to perform this action.', 'error');
    } else if (status === 404) {
      showToast(message || 'Resource not found', 'error');
    } else if (status === 400) {
       // Handle validation errors or bad request
       showToast(message || 'Invalid request', 'error');
    } else {
      showToast(message, 'error');
    }
    
    return Promise.reject(error);
  }
);

export default api;
