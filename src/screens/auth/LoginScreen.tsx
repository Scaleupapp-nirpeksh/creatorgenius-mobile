// src/screens/auth/LoginScreen.tsx
import React from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import {
  Text,
  Button,
  TextInput,
  HelperText,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types"; // Adjust path if needed
import { useAuthStore } from "../../store/authStore";
import { LoginCredentials } from "../../services/apiClient";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();

  // Select each property individually so TypeScript knows the types.
  // (Using separate selectors avoids issues with a second argument for equality.)
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const authError = useAuthStore((state) => state.authError);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  // Setup React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginCredentials) => {
    console.log("Attempting login with:", data.email);
    const success = await login(data);
    if (success) {
      console.log("Login seemed successful based on action return.");
      // Navigation can happen automatically based on isAuthenticated state changes.
    } else {
      console.log("Login failed based on action return.");
    }
  };

  // Clear API error when user starts typing again
  const handleInputChange =
    (onChange: (text: string) => void) => (text: string) => {
      if (authError) {
        setAuthError(null);
      }
      onChange(text);
    };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* Logo Component can be placed here later */}
        <Text
          variant="displaySmall"
          style={[styles.title, { color: theme.colors.primary }]}
        >
          CreatorGenius AI
        </Text>
        <Text variant="headlineSmall" style={styles.subtitle}>
          Log in to continue
        </Text>

        {/* Email Input */}
        <Controller
          control={control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: {
              value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,4})+$/,
              message: "Enter a valid email address",
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
                disabled={isLoggingIn}
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
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
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
                disabled={isLoggingIn}
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
          visible={!!authError && !errors.email && !errors.password}
          style={styles.apiError}
        >
          {authError}
        </HelperText>

        {/* Login Button */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoggingIn}
          disabled={isLoggingIn}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {isLoggingIn ? "Logging In..." : "Log In"}
        </Button>

        {/* Navigate to Register */}
        <Button
          mode="text"
          onPress={() => {
            console.log("Navigate to Register button pressed");
            console.log(
              "Auth state before navigation:",
              useAuthStore.getState()
            );
            navigation.navigate("Register");
            // Check again after to see if something changed
            setTimeout(() => {
              console.log(
                "Auth state after navigation:",
                useAuthStore.getState()
              );
            }, 100);
          }}
          disabled={isLoggingIn}
          style={styles.subtleButton}
        >
          {"Don't have an account? Sign Up"}
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
    justifyContent: "center",
    padding: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    color: "#6B7280",
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
    fontWeight: "bold",
    fontSize: 16,
  },
  subtleButton: {
    marginTop: 16,
  },
  apiError: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 8,
  },
});
