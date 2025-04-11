// src/navigation/ScriptNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScriptStackParamList } from './types';

// Import Script-related screens
import ScriptsScreen from '../screens/app/ScriptsScreen';
import CreateScriptScreen from '../screens/app/CreateScriptScreen';
import ScriptDetailScreen from '../screens/app/ScriptDetailScreen';
import ScriptPreviewScreen from '../screens/app/ScriptPreviewScreen';
import EditScriptScreen from '../screens/app/EditScriptScreen';
import TransformScriptScreen from '../screens/app/TransformScriptScreen';

const Stack = createNativeStackNavigator<ScriptStackParamList>();

const ScriptNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScriptsList" component={ScriptsScreen} />
      <Stack.Screen name="CreateScript" component={CreateScriptScreen} />
      <Stack.Screen name="ScriptDetail" component={ScriptDetailScreen} />
      <Stack.Screen name="ScriptPreview" component={ScriptPreviewScreen} />
      <Stack.Screen name="EditScript" component={EditScriptScreen} />
      <Stack.Screen name="TransformScript" component={TransformScriptScreen} />
    </Stack.Navigator>
  );
};

export default ScriptNavigator;