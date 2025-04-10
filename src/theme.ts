// src/theme.ts
import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// Optional: Configure fonts if you load custom fonts
// const fontConfig = { ... };
// const fonts = configureFonts({ config: fontConfig });

export const theme: MD3Theme = {
  ...DefaultTheme,
  // fonts: fonts, // Uncomment if using custom fonts
  colors: {
    ...DefaultTheme.colors,
    primary: '#4F46E5', // Indigo 600
    onPrimary: '#FFFFFF',
    primaryContainer: '#E0E7FF', // Indigo 100
    onPrimaryContainer: '#3730A3', // Indigo 800
    secondary: '#14B8A6', // Teal 500
    onSecondary: '#FFFFFF',
    secondaryContainer: '#99F6E4', // Teal 200
    onSecondaryContainer: '#0F766E', // Teal 700
    tertiary: '#F97316', // Orange 500 - Example Accent
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFE4B5', // Example
    onTertiaryContainer: '#C2410C', // Example
    error: '#EF4444', // Red 500
    onError: '#FFFFFF',
    errorContainer: '#FECACA', // Red 200
    onErrorContainer: '#B91C1C', // Red 700
    background: '#F9FAFB', // Gray 50
    onBackground: '#111827', // Gray 900
    surface: '#FFFFFF', // White
    onSurface: '#111827', // Gray 900
    surfaceVariant: '#E5E7EB', // Gray 200
    onSurfaceVariant: '#4B5563', // Gray 600
    outline: '#D1D5DB', // Gray 300
    // Add other overrides if needed: elevation, etc.
  },
};