// src/services/apiClient.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

const AUTH_TOKEN_KEY = 'creatorgenius_authToken'; // Make sure this matches what's in authStore.ts

// Define backend API base URL with platform-specific handling
let API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  if (Platform.OS === 'android') {
    API_BASE_URL = 'http://10.0.2.2:5001/api';
  } else if (Platform.OS === 'ios') {
    // For iOS simulator, try this special address
    API_BASE_URL = 'http://192.168.68.109:5001/api';
  } 
}

console.log(`API Base URL: ${API_BASE_URL}`);

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a longer timeout for slow connections during testing
  timeout: 30000, // 30 seconds
});

// --- Request Interceptor ---
// Add the JWT token to the Authorization header for every request if it exists
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get token directly from SecureStore
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Request with token to:', config.url);
      } else {
        console.log('No token found for request to:', config.url);
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config; // Continue with request even if token retrieval fails
    }
  },
  (error) => {
    console.error('Axios Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  async (error) => {
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error(`API Error ${error.response.status} from ${error.config?.url}:`, 
        error.response.data || 'No response data');
      
      // Handle 401 Unauthorized errors (token expired, invalid, etc.)
      if (error.response.status === 401 && !error.config._retry) {
        console.warn('Received 401 Unauthorized - Logging out.');
        error.config._retry = true; // Prevent infinite logout loops
        
        try {
          // Use getState to access store actions without hooks
          await useAuthStore.getState().logout();
          console.log('Logout completed after 401 error');
        } catch (logoutError) {
          console.error('Error during auto-logout:', logoutError);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error - No response received:', error.request._url || error.config?.url);
      console.error('Request details:', {
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout
      });
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    // Return a cleaner error object
    return Promise.reject(error.response?.data || {
      success: false,
      message: error.message || 'Network error occurred',
      isNetworkError: !error.response
    });
  }
);

// --- API Functions ---

export const registerUserApi = async (userData: RegisterUserData): Promise<ApiResponse<{ token: string }>> => {
  try {
    console.log('Registering user:', userData.email);
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    console.error('API Register Error:', error);
    throw error;
  }
};

export const loginUserApi = async (credentials: LoginCredentials): Promise<ApiResponse<{ token: string }>> => {
  try {
    console.log('Logging in user:', credentials.email);
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    console.error('API Login Error:', error);
    throw error;
  }
};

export const getCurrentUserApi = async (): Promise<User> => {
  try {
    console.log('Fetching current user data');
    const response = await apiClient.get<ApiResponse<User>>('/users/me');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to get user data');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('API Get Current User Error:', error);
    throw error;
  }
};

// --- Type Definitions ---

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscriptionTier?: string;
  profilePictureUrl?: string;
  interests?: string[];
  preferences?: object;
  usage?: object;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  count?: number;
  [key: string]: any;
}

export default apiClient;