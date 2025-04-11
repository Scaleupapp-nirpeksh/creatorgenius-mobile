// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/app/DashboardScreen';
import SavedIdeasScreen from '../screens/app/SavedIdeasScreen';
import IdeaDetailScreen from '../screens/app/IdeaDetailScreen';
import RefineIdeaScreen from '../screens/app/RefineIdeaScreen';
import CalendarScreen from '../screens/app/CalendarScreen';
import ScheduleDetailScreen from '../screens/app/ScheduleDetailScreen';
import AddScheduleScreen from '../screens/app/AddScheduleScreen';
import EditScheduleScreen from '../screens/app/EditScheduleScreen';
import GenerateIdeasScreen from '../screens/app/GenerateIdeasScreen'; // Import the new screen
import { AppTabParamList } from './types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, Text } from 'react-native-paper';
import { View } from 'react-native';

// Placeholder for Profile Screen (for example)
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text variant="titleLarge">{route.name} Screen</Text>
  </View>
);

// SavedIdeas Navigator
const SavedIdeasStack = createNativeStackNavigator();
const SavedIdeasNavigator = () => (
  <SavedIdeasStack.Navigator screenOptions={{ headerShown: false }}>
    <SavedIdeasStack.Screen name="SavedIdeasList" component={SavedIdeasScreen} />
    <SavedIdeasStack.Screen name="IdeaDetail" component={IdeaDetailScreen} />
    <SavedIdeasStack.Screen name="RefineIdea" component={RefineIdeaScreen} />
  </SavedIdeasStack.Navigator>
);

// Calendar Navigator
const CalendarStack = createNativeStackNavigator();
const CalendarNavigator = () => (
  <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
    <CalendarStack.Screen name="CalendarView" component={CalendarScreen} />
    <CalendarStack.Screen name="ScheduleDetail" component={ScheduleDetailScreen} />
    <CalendarStack.Screen name="AddSchedule" component={AddScheduleScreen} />
    <CalendarStack.Screen name="EditSchedule" component={EditScheduleScreen} />
  </CalendarStack.Navigator>
);

// Generate Navigator – updated to use our new GenerateIdeasScreen
const GenerateStack = createNativeStackNavigator();
const GenerateNavigator = () => (
  <GenerateStack.Navigator screenOptions={{ headerShown: false }}>
    <GenerateStack.Screen name="GenerateIdeas" component={GenerateIdeasScreen} />
  </GenerateStack.Navigator>
);

// Bottom Tab Navigator
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
            iconName = focused ? 'lightbulb-on' : 'lightbulb-on-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar-month' : 'calendar-month-outline';
          } else if (route.name === 'SavedItems') {
            iconName = focused ? 'bookmark-multiple' : 'bookmark-multiple-outline';
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
      <Tab.Screen name="Generate" component={GenerateNavigator} />
      <Tab.Screen name="SavedItems" component={SavedIdeasNavigator} />
      <Tab.Screen name="Calendar" component={CalendarNavigator} />
      <Tab.Screen name="Profile" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}
