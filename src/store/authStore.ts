// src/store/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import {
  loginUserApi,
  registerUserApi,
  getCurrentUserApi,
  User,
  LoginCredentials,
  RegisterUserData
} from '../services/apiClient';

// Key for storing the auth token securely on the device
// IMPORTANT: This MUST match the key used in apiClient.ts
const AUTH_TOKEN_KEY = 'creatorgenius_authToken';

// Interface for the state managed by the store
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Controls initial app load/auth check state
  isLoggingIn: boolean; // Specific loading state for the login process
  isRegistering: boolean; // Specific loading state for the registration process
  authError: string | null; // Stores errors from login/register attempts
}

// Interface for the actions available in the store
interface AuthActions {
  // Internal state setters
  setToken: (token: string | null) => Promise<void>; // Handles SecureStore interaction
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setIsLoggingIn: (loading: boolean) => void;
  setIsRegistering: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;

  // Core auth functions
  checkAuthStatus: () => Promise<void>; // Checks stored token on app startup
  login: (credentials: LoginCredentials) => Promise<boolean>; // Returns true on success
  register: (userData: RegisterUserData) => Promise<boolean>; // Returns true on success
  logout: () => Promise<void>;
}

// Create the Zustand store
export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // ----- Initial State -----
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start in loading state until checkAuthStatus completes
  isLoggingIn: false,
  isRegistering: false,
  authError: null,

  // ----- Actions -----

  // Handles setting token in state AND saving/deleting from SecureStore
  setToken: async (token) => {
    try {
      if (token) {
        // Log before saving to verify token exists (truncate for security)
        console.log("Saving token to SecureStore:", token.substring(0, 10) + "...");
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
        console.log("Token saved to SecureStore");
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        console.log("Token removed from SecureStore");
      }
      // Update state after storage operation
      set({ token, isAuthenticated: !!token });
    } catch (error) {
      console.error("Failed to update token in SecureStore:", error);
      // If storage fails, reflect this inconsistency in state
      set({ token: null, isAuthenticated: false, user: null });
    }
  },

  // Simple state setters
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setIsLoggingIn: (loading) => set({ isLoggingIn: loading }),
  setIsRegistering: (loading) => set({ isRegistering: loading }),
  setAuthError: (error) => set({ authError: error }),

  // Action called on app startup to check existing token
  checkAuthStatus: async () => {
    let currentToken: string | null = null;
    if (!get().isLoading) { // Only set loading if not already loading
      set({ isLoading: true });
    }
    set({ authError: null }); // Clear errors on check

    try {
      currentToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (currentToken) {
        console.log("AuthStore: Token found in storage, verifying...");
        // Verify token by fetching current user data
        const userData = await getCurrentUserApi(); // Interceptor adds token
        if (userData) {
          console.log("AuthStore: Token verified, user logged in.");
          set({ token: currentToken, user: userData, isAuthenticated: true });
        } else {
           // This case might be handled by the 401 interceptor now
           console.warn("AuthStore: Token found but failed to fetch user data (token might be invalid/expired).");
           throw new Error("Invalid session."); // Trigger logout in catch
        }
      } else {
        console.log("No token found.");
        // Ensure logged out state if no token
        set({ token: null, user: null, isAuthenticated: false });
      }
    } catch (error: any) {
      console.error("AuthStore: checkAuthStatus failed:", error.message);
      // Ensure cleanup happens if token is invalid or fetching user fails
      await get().logout(); // Use logout to ensure clean state & storage removal
    } finally {
      set({ isLoading: false }); // Always finish loading
    }
  },

  // Action to handle user login
  login: async (credentials: LoginCredentials): Promise<boolean> => {
    set({ isLoggingIn: true, authError: null }); // Start loading, clear errors
    try {
      const response = await loginUserApi(credentials);
      if (response.success && response.token) {
        // Save token first
        await get().setToken(response.token);
        
        // Add a small delay to ensure token is saved before the next request
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fetch user data to populate the store fully
        try {
          const userData = await getCurrentUserApi();
          set({ user: userData, isAuthenticated: true });
          console.log("AuthStore: Login successful.");
          set({ isLoggingIn: false });
          return true; // Indicate success
        } catch (userError) {
          console.error("Failed to fetch user data after login:", userError);
          throw new Error("Login succeeded but failed to get user profile.");
        }
      } else {
        // Handle cases where API returns success:false or no token
        throw new Error(response.message || "Login failed: Invalid response from server.");
      }
    } catch (error: any) {
      console.error("AuthStore: Login action error:", error);
      const errorMessage = error.message || "Login failed. Please check credentials.";
      set({ authError: errorMessage }); // Set error message for UI
      await get().logout(); // Ensure clean state on failure
      set({ isLoggingIn: false });
      return false; // Indicate failure
    }
  },

  register: async (userData: RegisterUserData): Promise<boolean> => {
    console.log('Starting registration process for:', userData.email);
    set({ isRegistering: true, authError: null });
    
    try {
      console.log('Calling registerUserApi...');
      const startTime = Date.now();
      const response = await registerUserApi(userData);
      console.log(`Registration API response received in ${Date.now() - startTime}ms:`, response);
      
      if (response.success && response.token) {
        console.log('Registration successful, saving token...');
        await get().setToken(response.token);
        
        console.log('Token saved, fetching user data with delay...');
        // Add a small delay to ensure token is saved
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          console.log('Calling getCurrentUserApi...');
          const userStartTime = Date.now();
          const newUser = await getCurrentUserApi();
          console.log(`User data received in ${Date.now() - userStartTime}ms:`, newUser);
          
          set({ user: newUser, isAuthenticated: true });
          console.log("AuthStore: Registration successful and complete.");
          set({ isRegistering: false });
          return true;
        } catch (userError) {
          console.error("Failed to fetch user data after registration:", userError);
          throw new Error("Registration succeeded but failed to get user profile.");
        }
      } else {
        console.error('Registration failed - success or token missing:', response);
        throw new Error(response.message || "Registration failed: Invalid response from server.");
      }
    } catch (error: any) {
      console.error("AuthStore: Register action failed:", error);
      const errorMessage = error.message || "Registration failed. Please try again.";
      console.log('Setting auth error:', errorMessage);
      set({ 
        authError: errorMessage,
        isRegistering: false 
      });
      return false;
    }
  },

  // Action to handle user logout
  logout: async () => {
    console.log("AuthStore: Logging out...");
    await get().setToken(null); // Clear token from state and SecureStore
    set({ user: null, isAuthenticated: false, authError: null }); // Reset user state
  },
}));