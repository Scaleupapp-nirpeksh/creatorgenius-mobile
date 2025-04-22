// src/navigation/AppNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "../screens/app/DashboardScreen";
import SavedIdeasScreen from "../screens/app/SavedIdeasScreen";
import IdeaDetailScreen from "../screens/app/IdeaDetailScreen";
import RefineIdeaScreen from "../screens/app/RefineIdeaScreen";
import CalendarScreen from "../screens/app/CalendarScreen";
import ScheduleDetailScreen from "../screens/app/ScheduleDetailScreen";
import AddScheduleScreen from "../screens/app/AddScheduleScreen";
import EditScheduleScreen from "../screens/app/EditScheduleScreen";
import GenerateIdeasScreen from "../screens/app/GenerateIdeasScreen";
import ScriptNavigator from "./ScriptNavigator";
import SeoAnalysisScreen from "../screens/app/SeoAnalysisScreen";
import AccountSettingsScreen from "../screens/app/AccountSettingsScreen";
import TrendsScreen from "../screens/app/TrendsScreen";
import SavedTrendsScreen from "../screens/app/SavedTrendsScreen";
import TrendIdeationScreen from "../screens/app/TrendIdeationScreen";
import WebViewScreen from "../screens/app/WebViewScreen";
import SavedSeoInsightsScreen from "../screens/app/SavedSeoInsightsScreen";
import SeoInsightDetailScreen from "../screens/app/SeoInsightDetailScreen";
import { useTheme, Appbar } from "react-native-paper";
import { AppTabParamList } from "./types";
import CustomTabBar from "../navigation/CustomTabBar";
import FeedbackScreen from "../screens/app/FeedbackScreen";

// SEO Navigator
const SeoStack = createNativeStackNavigator();
const SeoNavigator = () => (
  <SeoStack.Navigator screenOptions={{ headerShown: false }}>
    <SeoStack.Screen name="SeoAnalysis" component={SeoAnalysisScreen} />
    <SeoStack.Screen
      name="SavedSeoInsights"
      component={SavedSeoInsightsScreen}
    />
    <SeoStack.Screen
      name="SeoInsightDetail"
      component={SeoInsightDetailScreen}
    />
  </SeoStack.Navigator>
);

// SavedIdeas Navigator
const SavedIdeasStack = createNativeStackNavigator();
const SavedIdeasNavigator = () => (
  <SavedIdeasStack.Navigator screenOptions={{ headerShown: false }}>
    <SavedIdeasStack.Screen
      name="SavedIdeasList"
      component={SavedIdeasScreen}
    />
    <SavedIdeasStack.Screen name="IdeaDetail" component={IdeaDetailScreen} />
    <SavedIdeasStack.Screen name="RefineIdea" component={RefineIdeaScreen} />
  </SavedIdeasStack.Navigator>
);

// Calendar Navigator
const CalendarStack = createNativeStackNavigator();
const CalendarNavigator = () => (
  <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
    <CalendarStack.Screen name="CalendarView" component={CalendarScreen} />
    <CalendarStack.Screen
      name="ScheduleDetail"
      component={ScheduleDetailScreen}
    />
    <CalendarStack.Screen name="AddSchedule" component={AddScheduleScreen} />
    <CalendarStack.Screen name="EditSchedule" component={EditScheduleScreen} />
  </CalendarStack.Navigator>
);

// Generate Navigator
const GenerateStack = createNativeStackNavigator();
const GenerateNavigator = () => (
  <GenerateStack.Navigator screenOptions={{ headerShown: false }}>
    <GenerateStack.Screen
      name="GenerateIdeas"
      component={GenerateIdeasScreen}
    />
  </GenerateStack.Navigator>
);

// Trends Navigator
const TrendsStack = createNativeStackNavigator();
const TrendsNavigator = () => (
  <TrendsStack.Navigator screenOptions={{ headerShown: false }}>
    <TrendsStack.Screen name="TrendsQuery" component={TrendsScreen} />
    <TrendsStack.Screen name="SavedTrends" component={SavedTrendsScreen} />
    <TrendsStack.Screen name="TrendIdeation" component={TrendIdeationScreen} />
    <TrendsStack.Screen name="WebView" component={WebViewScreen} />
  </TrendsStack.Navigator>
);

// Bottom Tab Navigator
const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        lazy: true,
        // The background color can be applied to each screen individually
        // or via detached style components instead of contentStyle
      }}
    >
      {/* Visible Tab Screens */}
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Generate" component={GenerateNavigator} />
      <Tab.Screen name="SavedItems" component={SavedIdeasNavigator} />
      <Tab.Screen name="Calendar" component={CalendarNavigator} />
      <Tab.Screen name="Trends" component={TrendsNavigator} />
      <Tab.Screen name="SEO" component={SeoNavigator} />
      <Tab.Screen name="Scripts" component={ScriptNavigator} />
      <Tab.Screen name="Feedback" component={FeedbackScreen} />
      {/* Hidden Account Settings Screen */}
      <Tab.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={({ navigation }) => ({
          tabBarButton: () => null,
          headerShown: true,
          headerTitle: "Account Settings",
          headerRight: () => (
            <Appbar.Action
              icon="check"
              onPress={() => navigation.navigate("Dashboard")}
              color={theme.colors.primary}
              accessibilityLabel="Done"
            />
          ),
        })}
      />
    </Tab.Navigator>
  );
}
