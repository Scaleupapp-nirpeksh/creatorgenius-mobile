import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoadingScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.primary }]}>Loading...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  }
});