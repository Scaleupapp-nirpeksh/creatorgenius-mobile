// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/app/DashboardScreen';
import { AppTabParamList } from './types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, Text } from 'react-native-paper'; // <-- Import Text from Paper
import { View } from 'react-native'; // <-- Import View from react-native

// Placeholders for other screens/stacks
// Using Paper's Text component now
const PlaceholderScreen = ({ route }: any) => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text variant="titleLarge">{route.name} Screen</Text></View>;

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'help-circle-outline';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Generate') {
             iconName = focused ? 'lightbulb-on' : 'lightbulb-on-outline'; // Better icon idea
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar-month' : 'calendar-month-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account-circle' : 'account-circle-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Generate" component={PlaceholderScreen} />
      <Tab.Screen name="Calendar" component={PlaceholderScreen} />
      <Tab.Screen name="Profile" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}