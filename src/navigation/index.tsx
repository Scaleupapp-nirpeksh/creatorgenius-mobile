// src/navigation/index.tsx (Root Navigator - UPDATED)
import React, { useEffect } from 'react';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import LoadingScreen from '../screens/app/LoadingScreen';
// --- Import Zustand store hook ---
import { useAuthStore } from '../store/authStore'; // Adjust path if needed

export default function RootNavigator() {
  // --- Get state and actions from Zustand store ---
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
  // --- End Zustand ---

  // --- useEffect to check auth status on initial app load ---
  useEffect(() => {
   console.log("RootNavigator: Checking auth status on mount...");
   checkAuthStatus(); // Call the action from the store
  }, [checkAuthStatus]); // Dependency array includes the action itself
  // --- End useEffect ---


  if (isLoading) {
    // Show loading screen while checkAuthStatus is running
    return <LoadingScreen />;
  }

  // Conditionally render navigator based on authentication state from store
  console.log("RootNavigator: isLoading=false, isAuthenticated=", isAuthenticated);
  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}