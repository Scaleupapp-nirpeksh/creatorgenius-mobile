import React from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <Text variant="headlineLarge" style={{ marginBottom: 24 }}>Register Screen</Text>
      <Button mode="contained" onPress={() => {/* TODO: Register Logic */}}>Sign Up (Placeholder)</Button>
      <Button mode="text" onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
        Already have an account? Log In
      </Button>
    </SafeAreaView>
  );
}