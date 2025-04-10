// App.tsx (Root Component)
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme'; // Import your custom theme
import RootNavigator from './src/navigation/index';
// Import Zustand provider/initializer if needed (often Zustand doesn't require a provider)

export default function App() {
  // Initialize Zustand store, check initial auth status here (we'll add later)

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}