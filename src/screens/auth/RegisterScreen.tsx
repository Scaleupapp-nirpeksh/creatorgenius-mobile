// src/screens/auth/RegisterScreen.tsx
import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, HelperText, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { RegisterUserData } from '../../services/apiClient';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const theme = useTheme();
  
  // Select needed state and actions from the auth store
  const register = useAuthStore((state) => state.register);
  const isRegistering = useAuthStore((state) => state.isRegistering);
  const authError = useAuthStore((state) => state.authError);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  // Setup React Hook Form
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterUserData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: RegisterUserData) => {
    console.log('Attempting registration with:', data.email);
    const success = await register(data);
    if (success) {
      console.log('Registration successful based on action return.');
      // Navigation happens automatically based on isAuthenticated state
    } else {
      console.log('Registration failed based on action return.');
    }
  };

  // Clear API error when user starts typing again
  const handleInputChange = (onChange: (text: string) => void) => (text: string) => {
    if (authError) {
      setAuthError(null);
    }
    onChange(text);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
          CreatorGenius AI
        </Text>
        <Text variant="headlineSmall" style={styles.subtitle}>
          Create your account
        </Text>

        {/* Name Input */}
        <Controller
          control={control}
          name="name"
          rules={{
            required: 'Name is required',
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Full Name"
                mode="outlined"
                onBlur={onBlur}
                onChangeText={handleInputChange(onChange)}
                value={value}
                autoCapitalize="words"
                error={!!errors.name}
                left={<TextInput.Icon icon="account-outline" />}
                disabled={isRegistering}
              />
              {errors.name && (
                <HelperText type="error" visible={!!errors.name}>
                  {errors.name.message}
                </HelperText>
              )}
            </View>
          )}
        />

        {/* Email Input */}
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,4})+$/,
              message: 'Enter a valid email address',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Email"
                mode="outlined"
                onBlur={onBlur}
                onChangeText={handleInputChange(onChange)}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email || !!authError}
                left={<TextInput.Icon icon="email-outline" />}
                disabled={isRegistering}
              />
              {errors.email && (
                <HelperText type="error" visible={!!errors.email}>
                  {errors.email.message}
                </HelperText>
              )}
            </View>
          )}
        />

        {/* Password Input */}
        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Password"
                mode="outlined"
                onBlur={onBlur}
                onChangeText={handleInputChange(onChange)}
                value={value}
                secureTextEntry
                error={!!errors.password || !!authError}
                left={<TextInput.Icon icon="lock-outline" />}
                disabled={isRegistering}
              />
              {errors.password && (
                <HelperText type="error" visible={!!errors.password}>
                  {errors.password.message}
                </HelperText>
              )}
            </View>
          )}
        />

        {/* API Error Message */}
        <HelperText
          type="error"
          visible={!!authError}
          style={styles.apiError}
        >
          {authError}
        </HelperText>

        {/* Register Button */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isRegistering}
          disabled={isRegistering}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {isRegistering ? 'Creating Account...' : 'Sign Up'}
        </Button>

        {/* Navigate to Login */}
        <Button
          mode="text"
          onPress={() => {
            console.log("Navigate to Login button pressed");
            navigation.navigate('Login');
          }}
          disabled={isRegistering}
          style={styles.subtleButton}
        >
          {'Already have an account? Log In'}
        </Button>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#6B7280',
  },
  inputContainer: {
    marginBottom: 12,
  },
  button: {
    marginTop: 24,
    borderRadius: 30,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtleButton: {
    marginTop: 16,
  },
  apiError: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
});