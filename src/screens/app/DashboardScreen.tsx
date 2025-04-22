// src/screens/app/DashboardScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
// Import SegmentedButtons
import {
  Text,
  Button,
  Surface,
  Avatar,
  IconButton,
  ProgressBar,
  SegmentedButtons,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as Location from "expo-location";

import {
  getUpcomingScheduledContent,
  getRecentIdeas,
  ScheduledContent, // Assuming this type is correctly defined elsewhere (e.g., has ideaId?, scheduledDate, publishingPlatform etc.)
  SavedIdea,
} from "../../services/dashboardService";

import {
  getCurrentUserApi,
  getUserUsageApi,
  UsageData,
  UsageFeature,
} from "../../services/apiClient";

interface User {
  _id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  subscriptionTier?: "free" | "creator_pro" | "agency_growth";
  usage?: Record<string, any>;
  [key: string]: any;
}

// Define a default theme structure if useTheme() is not used
// This needs to be accessible by StyleSheet.create below
const defaultTheme = {
  colors: {
    primary: "#10b981", // a green
    onPrimary: "#ffffff",
    primaryContainer: "#BBF7D0",
    background: "#fafafa", // a light background
    error: "#EF4444", // red
    surface: "#ffffff",
    textPrimary: "#1F2937", // near-black
    textSecondary: "#6B7280", // cool gray
  },
};

// --- START: Enhanced Usage Item Component ---
interface UsageItemProps {
  label: string;
  usage: UsageFeature;
  theme: typeof defaultTheme; // Pass theme for colors (used internally if needed, or defaultTheme if static)
}

const UsageItem: React.FC<UsageItemProps> = ({ label, usage, theme }) => {
  const { current, limit } = usage;
  const isUnlimited = limit === "unlimited";

  let progress = 0;
  let statusColor = theme.colors.primary; // Green (OK)
  let usageText = "";
  let accessibilityHint = "";

  if (isUnlimited) {
    statusColor = theme.colors.textSecondary; // Use a neutral color for unlimited
    usageText = `${current} Used`;
    accessibilityHint = `Usage for ${label}: ${current} used, limit is unlimited.`;
  } else if (typeof limit === "number" && limit > 0) {
    progress = Math.min(1, Math.max(0, current / limit)); // Clamp progress between 0 and 1
    usageText = `${current} / ${limit}`;
    accessibilityHint = `Usage for ${label}: ${current} out of ${limit}.`;

    if (progress >= 0.95) {
      statusColor = theme.colors.error; // Red (Critical)
      accessibilityHint += " Limit nearing critical.";
    } else if (progress >= 0.75) {
      statusColor = "#f97316"; // Orange (Warning)
      accessibilityHint += " Limit nearing warning threshold.";
    } else {
      statusColor = theme.colors.primary; // Green (OK)
      accessibilityHint += " Usage is within normal limits.";
    }
  } else if (typeof limit === "number" && limit === 0 && current > 0) {
    // Handle edge case: Limit is 0, but usage exists (treat as exceeded)
    progress = 1;
    statusColor = theme.colors.error;
    usageText = `${current} / ${limit}`;
    accessibilityHint = `Usage for ${label}: ${current} used, limit is 0. Exceeded.`;
  } else {
    // Handle edge case: Limit is 0, no usage
    progress = 0;
    statusColor = theme.colors.primary;
    usageText = `${current} / ${limit}`;
    accessibilityHint = `Usage for ${label}: ${current} out of ${limit}.`;
  }

  let result = label.replace(/([a-z])([A-Z])/g, "$1 $2");
  // Format label: Capitalize, replace underscores
  const displayLabel = result.charAt(0).toUpperCase() + result.slice(1);

  return (
    <View
      style={styles.usageItemContainer}
      accessibilityLabel={displayLabel}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.usageItemLabelContainer}>
        {/* Status Dot */}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text
          style={[
            styles.usageFeatureLabel,
            { color: theme.colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
      </View>

      {isUnlimited ? (
        <View style={styles.usageValueContainer}>
          <MaterialCommunityIcons
            name="infinity"
            size={16}
            color={theme.colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.usageCountText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {usageText}
          </Text>
        </View>
      ) : (
        <View>
          <ProgressBar
            progress={progress}
            color={statusColor} // Use statusColor for consistency
            style={styles.usageProgressBar}
            visible={!isUnlimited} // Hide if unlimited (though container handles this)
          />
          <Text
            style={[
              styles.usageCountText,
              { color: theme.colors.textSecondary, marginLeft: 8 },
            ]}
          >
            {usageText}
          </Text>
        </View>
      )}
    </View>
  );
};
// --- END: Enhanced Usage Item Component ---

function DashboardScreen() {
  // Use the globally defined defaultTheme object inside the component
  const theme = defaultTheme;
  const user = useAuthStore((state) => state.user) as User | null;
  const logout = useAuthStore((state) => state.logout);
  const navigation = useNavigation<any>();

  // --- State ---
  const [location, setLocation] = useState("Determining location...");
  const [upcomingContent, setUpcomingContent] = useState<ScheduledContent[]>(
    []
  );
  const [recentIdeas, setRecentIdeas] = useState<SavedIdea[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  console.log("🚀 ~ DashboardScreen ~ usageData:", usageData);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [activeUsageTab, setActiveUsageTab] = useState<"daily" | "monthly">(
    "daily"
  ); // State for Tabs

  // --- Effects ---
  // Fetch location on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;
        if (status !== "granted") {
          setLocation("Location access denied");
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!isMounted) return;
        const { latitude, longitude } = position.coords;
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (!isMounted) return;
        if (geocode && geocode[0]) {
          const { city, region, country } = geocode[0];
          setLocation(city || region || country || "Unknown location");
        } else {
          setLocation("Could not determine location");
        }
      } catch (error) {
        console.error("Location error:", error);
        if (isMounted) setLocation("Location unavailable");
      } finally {
        if (isMounted) setLoadingLocation(false);
      }
    })();
    return () => {
      isMounted = false;
    }; // Cleanup
  }, []);

  // Fetch dashboard data (upcoming, recent) on screen focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchData = async () => {
        setLoadingUpcoming(true);
        setLoadingIdeas(true);
        try {
          const [upcomingRes, ideasRes] = await Promise.all([
            getUpcomingScheduledContent(),
            getRecentIdeas(),
          ]);
          if (isActive) {
            // Ensure data exists and is an array before setting state
            setUpcomingContent(
              Array.isArray(upcomingRes?.data) ? upcomingRes.data : []
            );
            setRecentIdeas(Array.isArray(ideasRes?.data) ? ideasRes.data : []);
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          if (isActive) {
            setUpcomingContent([]); // Set to empty array on error
            setRecentIdeas([]);
          }
        } finally {
          if (isActive) {
            setLoadingUpcoming(false);
            setLoadingIdeas(false);
          }
        }
      };
      fetchData();
      return () => {
        isActive = false;
      };
    }, [])
  );

  // Refresh user doc on screen focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      async function refreshUser() {
        try {
          const updatedUser = await getCurrentUserApi();
          if (isActive) useAuthStore.getState().setUser(updatedUser);
        } catch (error: any) {
          console.warn("Failed to refresh user data:", error.message || error);
        }
      }
      refreshUser();
      return () => {
        isActive = false;
      };
    }, [])
  );

  // Fetch usage data on screen focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      async function fetchUsage() {
        setUsageLoading(true);
        setUsageError(null);
        try {
          const resp = await getUserUsageApi();
          if (isActive) {
            if (!resp.success || !resp.data) {
              // Don't throw error here, maybe just set empty state or warning
              console.warn("No usage data returned:", resp.message);
              setUsageData({ daily: {}, monthly: {}, permanent: {} }); // Set empty data
              // throw new Error(resp.message || 'No usage data returned.');
            } else {
              setUsageData(resp.data);
            }
          }
        } catch (err: any) {
          console.error("Error fetching usage data:", err);
          if (isActive)
            setUsageError(err.message || "Error fetching usage data");
        } finally {
          if (isActive) setUsageLoading(false);
        }
      }
      fetchUsage();
      return () => {
        isActive = false;
      };
    }, [])
  );

  // --- Handlers & Helpers ---
  const handleLogout = () => {
    console.log("Logout button pressed");
    logout();
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return "?";
    const parts = name
      .trim()
      .split(" ")
      .filter((part) => part.length > 0);
    if (parts.length === 0) return "?";
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const navigateToIdeation = () => navigation.navigate("Generate");
  const navigateToTrends = () => navigation.navigate("Trends");
  const navigateToSavedItems = () => navigation.navigate("SavedItems");
  const navigateToSEO = () => navigation.navigate("SEO");
  const navigateToCalendar = () => navigation.navigate("Calendar");
  const navigateToScripts = () => navigation.navigate("Scripts");
  const navigateToAccountSettings = () =>
    navigation.navigate("AccountSettings");

  const navigateToScheduledItem = (id: string) =>
    navigation.navigate("Calendar", {
      screen: "ScheduleDetail",
      params: { id },
      initial: false,
    });
  const navigateToIdea = (id: string) =>
    navigation.navigate("SavedItems", {
      screen: "IdeaDetail",
      params: { ideaId: id },
      initial: false,
    });

  const subscriptionConfig = {
    free: {
      label: "Free",
      icon: "star-outline",
      backgroundColor: "#f97316",
      textColor: "#ffffff",
    },
    creator_pro: {
      label: "Pro",
      icon: "star-check",
      backgroundColor: "#10b981",
      textColor: "#ffffff",
    },
    agency_growth: {
      label: "Agency",
      icon: "crown",
      backgroundColor: "#3b82f6",
      textColor: "#ffffff",
    },
    default: {
      label: "Unknown",
      icon: "help-circle-outline",
      backgroundColor: "#6B7280",
      textColor: "#ffffff",
    },
  };
  const subscriptionKey =
    user?.subscriptionTier && subscriptionConfig[user.subscriptionTier]
      ? user.subscriptionTier
      : "default";
  const subscriptionData =
    subscriptionConfig[subscriptionKey as keyof typeof subscriptionConfig];

  const formatDate = (
    dateStr: string | Date | undefined | null,
    includeYear: boolean = false
  ): string => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid Date";
      const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
      };
      if (includeYear) options.year = "numeric";
      return date.toLocaleDateString("en-IN", options);
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Error Date";
    }
  };

  const formatHeaderDate = (date: Date): string =>
    date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // --- Render ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- HEADER --- */}
        <Surface style={styles.headerSurface} elevation={1}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Text
                variant="titleMedium"
                style={[
                  styles.welcomeText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Welcome back,
              </Text>
              <View style={styles.nameRow}>
                <Text
                  variant="headlineMedium"
                  style={[styles.userName, { color: theme.colors.primary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {user?.name || "Creator"}
                </Text>
                <TouchableOpacity
                  onPress={navigateToAccountSettings}
                  style={styles.subscriptionBadgeTouchable}
                >
                  <View
                    style={[
                      styles.subscriptionBadge,
                      { backgroundColor: subscriptionData.backgroundColor },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={subscriptionData.icon}
                      size={14}
                      color={subscriptionData.textColor}
                      style={styles.subscriptionIcon}
                    />
                    <Text
                      style={[
                        styles.subscriptionText,
                        { color: subscriptionData.textColor },
                      ]}
                    >
                      {subscriptionData.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <Text
                variant="bodySmall"
                style={[styles.dateText, { color: theme.colors.textSecondary }]}
              >
                {formatHeaderDate(new Date())} •{" "}
                {loadingLocation ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.textSecondary}
                  />
                ) : (
                  location
                )}
              </Text>
            </View>
            <TouchableOpacity
              onPress={navigateToAccountSettings}
              style={styles.avatarContainer}
            >
              {user?.profilePictureUrl ? (
                <Avatar.Image
                  size={56}
                  source={{ uri: user.profilePictureUrl }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={56}
                  label={getInitials(user?.name)}
                  style={[
                    styles.avatar,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  labelStyle={styles.avatarLabel}
                />
              )}
            </TouchableOpacity>
          </View>
        </Surface>

        {/* --- USAGE OVERVIEW with TABS --- */}
        <View style={styles.sectionContainer}>
          <Text
            variant="titleLarge"
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, marginBottom: 12 },
            ]}
          >
            Usage Overview
          </Text>
          <Surface style={styles.usageSurface} elevation={1}>
            {usageLoading ? (
              <ActivityIndicator
                style={{ marginVertical: 40 }}
                size="large"
                color={theme.colors.primary}
              />
            ) : usageError ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={24}
                  color={theme.colors.error}
                />
                <Text style={styles.errorText}>{usageError}</Text>
              </View>
            ) : usageData ? (
              <>
                <SegmentedButtons
                  value={activeUsageTab}
                  onValueChange={(value) =>
                    setActiveUsageTab(value as "daily" | "monthly")
                  }
                  style={styles.segmentedButtons}
                  buttons={[
                    {
                      value: "daily",
                      label: "Daily",
                      icon: "calendar-today",
                      accessibilityLabel: "Show Daily Usage",
                      disabled:
                        !usageData.daily ||
                        Object.keys(usageData.daily).length === 0,
                    },
                    {
                      value: "monthly",
                      label: "Monthly",
                      icon: "calendar-month",
                      accessibilityLabel: "Show Monthly Usage",
                      disabled:
                        !usageData.monthly ||
                        Object.keys(usageData.monthly).length === 0,
                    },
                  ]}
                />
                <View style={styles.usageListContainer}>
                  {/* Render usage items based on active tab */}
                  {usageData[activeUsageTab] &&
                  Object.keys(usageData[activeUsageTab]).length > 0 ? (
                    Object.entries(usageData[activeUsageTab]).map(
                      ([featureKey, usage], index, arr) => (
                        <UsageItem
                          key={`${activeUsageTab}-${featureKey}`}
                          label={featureKey}
                          // Ensure usage is correctly typed or cast if necessary
                          usage={usage as UsageFeature}
                          theme={theme} // Pass theme down
                        />
                      )
                    )
                  ) : (
                    <Text style={styles.emptyUsageText}>
                      No relevant usage limits found.
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <Text style={styles.emptyUsageText}>
                Usage data is currently unavailable.
              </Text>
            )}
          </Surface>
        </View>

        {/* --- COMING UP SOON --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text
              variant="titleLarge"
              style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
            >
              Coming Up Soon
            </Text>
            <IconButton
              icon="calendar-month-outline"
              onPress={navigateToCalendar}
              mode="contained"
              containerColor={theme.colors.primaryContainer}
              iconColor={theme.colors.primary}
              size={20}
              style={styles.headerIconButton}
            />
          </View>
          <Surface style={styles.contentCard} elevation={1}>
            {loadingUpcoming ? (
              <ActivityIndicator
                style={{ margin: 20 }}
                color={theme.colors.primary}
              />
            ) : upcomingContent.length > 0 ? (
              <>
                {upcomingContent.slice(0, 3).map((item, index) => (
                  // FIX 1 & 2 applied here: removed "|| item.title"
                  <TouchableOpacity
                    key={item._id}
                    onPress={() => navigateToScheduledItem(item._id)}
                    accessibilityLabel={`View details for ${
                      item.ideaId?.title || "Untitled Content"
                    }`}
                  >
                    <View
                      style={[
                        styles.listItemBase,
                        styles.calendarItem,
                        index === upcomingContent.slice(0, 3).length - 1
                          ? styles.lastItem
                          : {},
                      ]}
                    >
                      <View style={styles.dateChip}>
                        <Text variant="labelMedium" style={styles.dateChipText}>
                          {formatDate(item.scheduledDate)}
                        </Text>
                      </View>
                      <View style={styles.listItemContent}>
                        {/* FIX 1 & 2 applied here: removed "|| item.title" */}
                        <Text variant="titleSmall" numberOfLines={1}>
                          {item.ideaId?.title || "Untitled Content"}
                        </Text>
                        <Text variant="bodySmall" style={styles.platformText}>
                          {item.publishingPlatform || "No Platform"}
                        </Text>
                      </View>
                      <IconButton
                        icon="chevron-right"
                        size={24}
                        iconColor={theme.colors.textSecondary}
                        style={styles.chevronIcon}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
                <Button
                  mode="text"
                  onPress={navigateToCalendar}
                  style={styles.viewAllButton}
                  labelStyle={{ color: theme.colors.primary }}
                  icon="arrow-right"
                  contentStyle={styles.viewAllButtonContent}
                >
                  View Calendar
                </Button>
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={40}
                  color="#D1D5DB"
                />
                <Text variant="bodyMedium" style={styles.emptyStateText}>
                  Nothing scheduled soon. Ready to plan?
                </Text>
                <Button
                  mode="contained"
                  onPress={navigateToCalendar}
                  style={[
                    styles.emptyStateButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  labelStyle={{ color: theme.colors.onPrimary }}
                  icon="plus-circle-outline"
                >
                  Plan Content
                </Button>
              </View>
            )}
          </Surface>
        </View>

        {/* --- RECENT IDEAS --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text
              variant="titleLarge"
              style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
            >
              Recent Ideas
            </Text>
            <IconButton
              icon="lightbulb-on-outline"
              onPress={navigateToSavedItems}
              mode="contained"
              containerColor={theme.colors.primaryContainer}
              iconColor={theme.colors.primary}
              size={20}
              style={styles.headerIconButton}
            />
          </View>
          <Surface style={styles.contentCard} elevation={1}>
            {loadingIdeas ? (
              <ActivityIndicator
                style={{ margin: 20 }}
                color={theme.colors.primary}
              />
            ) : recentIdeas.length > 0 ? (
              <>
                {recentIdeas.slice(0, 3).map((idea, index) => (
                  <TouchableOpacity
                    key={idea._id}
                    onPress={() => navigateToIdea(idea._id)}
                    accessibilityLabel={`View details for idea titled ${
                      idea.title || "Untitled Idea"
                    }`}
                  >
                    <View
                      style={[
                        styles.listItemBase,
                        styles.ideaItem,
                        index === recentIdeas.slice(0, 3).length - 1
                          ? styles.lastItem
                          : {},
                      ]}
                    >
                      <View style={styles.ideaIconContainer}>
                        <MaterialCommunityIcons
                          name="lightbulb-outline"
                          size={20}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.listItemContent}>
                        <Text variant="titleSmall" numberOfLines={1}>
                          {idea.title || "Untitled Idea"}
                        </Text>
                        <Text
                          variant="bodySmall"
                          numberOfLines={1}
                          style={styles.ideaAngle}
                        >
                          {idea.angle || "No angle provided"}
                        </Text>
                      </View>
                      <IconButton
                        icon="chevron-right"
                        size={24}
                        iconColor={theme.colors.textSecondary}
                        style={styles.chevronIcon}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
                {recentIdeas.length > 3 && (
                  <Button
                    mode="text"
                    onPress={navigateToSavedItems}
                    style={styles.viewAllButton}
                    labelStyle={{ color: theme.colors.primary }}
                    icon="arrow-right"
                    contentStyle={styles.viewAllButtonContent}
                  >
                    View All Ideas
                  </Button>
                )}
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons
                  name="lightbulb-alert-outline"
                  size={40}
                  color="#D1D5DB"
                />
                <Text variant="bodyMedium" style={styles.emptyStateText}>
                  No ideas saved yet. Let's brainstorm!
                </Text>
                <Button
                  mode="contained"
                  onPress={navigateToIdeation}
                  style={[
                    styles.emptyStateButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  labelStyle={{ color: theme.colors.onPrimary }}
                  icon="brain"
                >
                  Generate Ideas
                </Button>
              </View>
            )}
          </Surface>
        </View>

        {/* --- AI TOOLKIT --- */}
        <View style={styles.sectionContainer}>
          <Text
            variant="titleLarge"
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, marginBottom: 12 },
            ]}
          >
            Your AI Toolkit
          </Text>
          <View style={styles.toolkitGrid}>
            {/* Reusable Toolkit Card Component (Conceptual) */}
            {[
              {
                title: "AI Ideation",
                icon: "lightbulb-on-outline",
                color: "#f97316",
                bgColor: "rgba(251,146,60,0.1)",
                description: "Generate fresh content ideas",
                onPress: navigateToIdeation,
              },
              {
                title: "Trend Query",
                icon: "trending-up",
                color: "#3b82f6",
                bgColor: "rgba(59,130,246,0.1)",
                description: "Explore latest trends & news",
                onPress: navigateToTrends,
              },
              {
                title: "Saved Items",
                icon: "bookmark-multiple-outline",
                color: "#8b5cf6",
                bgColor: "rgba(139,92,246,0.1)",
                description: "Ideas, Insights, Scripts",
                onPress: navigateToSavedItems,
              },
              {
                title: "Calendar",
                icon: "calendar-month-outline",
                color: "#ec4899",
                bgColor: "rgba(236,72,153,0.1)",
                description: "Plan your posting schedule",
                onPress: navigateToCalendar,
              },
              {
                title: "SEO Analyzer",
                icon: "magnify-scan",
                color: "#10b981",
                bgColor: "rgba(16,185,129,0.1)",
                description: "Optimize for discoverability",
                onPress: navigateToSEO,
              },
              {
                title: "Script Hub",
                icon: "script-text-outline",
                color: "#06b6d4",
                bgColor: "rgba(6,182,212,0.1)",
                description: "Generate & manage scripts",
                onPress: navigateToScripts,
              },
            ].map((tool) => (
              <TouchableOpacity
                key={tool.title}
                onPress={tool.onPress}
                style={styles.toolCardWrapper}
                accessibilityRole="button"
                accessibilityLabel={tool.title}
              >
                <Surface style={styles.toolCard} elevation={1}>
                  <View
                    style={[
                      styles.toolCardContent,
                      { backgroundColor: tool.bgColor },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={tool.icon}
                      size={32}
                      color={tool.color}
                    />
                    <Text variant="titleMedium" style={styles.toolCardTitle}>
                      {tool.title}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={styles.toolCardDescription}
                    >
                      {tool.description}
                    </Text>
                  </View>
                </Surface>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- Logout --- */}
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            icon="logout"
            textColor={theme.colors.error}
          >
            Log Out
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16 },

  // Header
  headerSurface: { borderRadius: 16, marginTop: 8, marginBottom: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: { flex: 1, marginRight: 12 },
  welcomeText: { fontWeight: "500", marginBottom: 2 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  userName: {
    fontWeight: "bold",
    marginRight: 8,
    lineHeight: 30,
    flexShrink: 1,
  }, // Allow shrinking
  subscriptionBadgeTouchable: { marginLeft: "auto" }, // Push badge to right if name wraps early
  subscriptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  subscriptionIcon: { marginRight: 4 },
  subscriptionText: { fontSize: 11, fontWeight: "bold" },
  dateText: { marginTop: 2, flexDirection: "row", alignItems: "center" },
  avatarContainer: {},
  avatar: {
    elevation: 2,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  avatarLabel: {
    color: defaultTheme.colors.onPrimary,
    fontWeight: "bold",
    fontSize: 20,
  },

  // Sections
  sectionContainer: { marginBottom: 24 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 20,
    flexShrink: 1,
    marginRight: 8,
  },
  headerIconButton: { margin: 0 }, // Reset margin for icon buttons in headers

  // Usage Overview
  usageSurface: {
    borderRadius: 12,
    backgroundColor: defaultTheme.colors.surface,
  },
  segmentedButtons: { marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  usageListContainer: { paddingBottom: 8 }, // Padding below list items, before card bottom
  usageItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12, // Slightly more padding
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6", // Lighter separator
  },
  // Style for last item in lists to remove border
  lastItem: {
    borderBottomWidth: 0,
  },
  usageItemLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.5, // Adjust flex basis
    marginRight: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  usageFeatureLabel: {
    fontWeight: "500",
    fontSize: 14,
    color: defaultTheme.colors.textPrimary,
    flexShrink: 1, // Allow label text to shrink
  },
  usageValueContainer: {
    flex: 0.5, // Adjust flex basis
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  usageProgressBar: {
    flex: 1, // Take available space in the container
    height: 8, // Keep thickness
    borderRadius: 4,
    maxWidth: "70%", // Limit progress bar width relative to its container
  },
  usageCountText: {
    fontSize: 12, // Slightly smaller count text
    minWidth: 55, // Reduced min-width, adjust as needed
    textAlign: "right",
    color: defaultTheme.colors.textSecondary,
    marginLeft: 8, // Keep space from bar/icon
  },
  errorContainer: {
    // For usage error display inside the card
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderRadius: 8,
    margin: 16, // Margin around the error message
  },
  errorText: {
    color: defaultTheme.colors.error,
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
  },
  emptyUsageText: {
    color: defaultTheme.colors.textSecondary,
    textAlign: "center",
    paddingVertical: 24,
    fontStyle: "italic",
  },

  // Content Cards (Upcoming, Recent Ideas) - General List Item Style
  contentCard: {
    borderRadius: 12,
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 0,
    backgroundColor: defaultTheme.colors.surface,
  }, // Remove horizontal padding from card itself
  listItemBase: {
    // Base styles for touchable list items
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16, // Add horizontal padding here now
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listItemContent: { flex: 1, marginRight: 4 }, // Content area within list item
  chevronIcon: { margin: -4 }, // Adjust chevron spacing if needed
  viewAllButton: {
    marginTop: 4,
    marginBottom: 4,
    alignSelf: "flex-end",
    marginRight: 8,
  }, // Common style for "View All" buttons
  viewAllButtonContent: { flexDirection: "row-reverse" }, // Icon on right

  // Calendar Item Specifics
  calendarItem: {
    /* Inherits listItemBase */
  },
  dateChip: {
    backgroundColor: defaultTheme.colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  // FIX 3 applied here: Use defaultTheme directly
  dateChipText: {
    color: defaultTheme.colors.primary,
    fontWeight: "bold",
    fontSize: 12,
  }, // Style for date text
  platformText: {
    color: defaultTheme.colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },

  // Idea Item Specifics
  ideaItem: {
    /* Inherits listItemBase */
  },
  ideaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: defaultTheme.colors.primaryContainer,
  },
  ideaAngle: {
    color: defaultTheme.colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },

  // Empty States
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    minHeight: 150,
    justifyContent: "center",
  },
  emptyStateText: {
    color: defaultTheme.colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
    paddingHorizontal: 16,
  },
  emptyStateButton: { marginTop: 8, borderRadius: 20, paddingHorizontal: 16 },

  // AI Toolkit
  toolkitGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  toolCardWrapper: { width: "50%", padding: 6 },
  toolCard: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: defaultTheme.colors.surface,
  },
  toolCardContent: {
    padding: 12,
    alignItems: "center",
    minHeight: 130,
    justifyContent: "center",
  },
  toolCardTitle: {
    marginTop: 10,
    fontWeight: "600",
    textAlign: "center",
    color: defaultTheme.colors.textPrimary,
    fontSize: 14,
  },
  toolCardDescription: {
    marginTop: 2,
    textAlign: "center",
    color: defaultTheme.colors.textSecondary,
    fontSize: 11,
    paddingHorizontal: 4,
    lineHeight: 14,
  },

  // Logout
  logoutContainer: { alignItems: "center", marginTop: 16, marginBottom: 24 },
  logoutButton: {
    borderColor: defaultTheme.colors.error,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    minWidth: "40%",
  },
});

export default DashboardScreen;
