// src/screens/app/DashboardScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button, Card, useTheme, Avatar, IconButton, Chip, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUpcomingScheduledContent, getRecentIdeas, ScheduledContent, SavedIdea } from '../../services/dashboardService';
import * as Location from 'expo-location';
import { getCurrentUserApi } from '../../services/apiClient';


interface UsageStats {
  ideationsThisMonth?: number;
  refinementsThisMonth?: number;
  seoReportsThisMonth?: number;
  scriptsGeneratedThisMonth?: number;
  scriptTransformationsThisMonth?: number;
  insightsSavedThisMonth?: number;
  lastUsageReset?: string;
  dailySearchCount?: number;
  dailySeoAnalyses?: number;
  dailyInsightsSaved?: number;
  dailyTrendIdeations?: number;
  lastSearchReset?: string;
  lastInsightsReset?: string;
  [key: string]: any;
}

interface User {
  _id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  subscriptionTier?: 'free' | 'creator_pro' | 'agency_growth';
  usage?: UsageStats;
  [key: string]: any;
}

// Optional: Gradient Background Component (if needed later)
interface GradientBackgroundProps {
  colors: string[];
  style?: any;
  children: React.ReactNode;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ colors, style, children }) => {
  return (
    <View style={[{ backgroundColor: colors[0] }, style]}>
      {children}
    </View>
  );
};

function DashboardScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user) as User | null;
  const logout = useAuthStore((state) => state.logout);
  const navigation = useNavigation<any>();
  const screenWidth = Dimensions.get('window').width;

  // State for dynamic content
  const [location, setLocation] = useState("Determining location...");
  const [upcomingContent, setUpcomingContent] = useState<ScheduledContent[]>([]);
  const [recentIdeas, setRecentIdeas] = useState<SavedIdea[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Get current date info
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // --- Get User Location ---
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation("Location access denied");
          setLoadingLocation(false);
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode && geocode[0]) {
          const { city, region } = geocode[0];
          setLocation(city || region || "Unknown location");
        } else {
          setLocation("Unknown location");
        }
      } catch (error) {
        console.error("Location error:", error);
        setLocation("Location unavailable");
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // --- Fetch upcoming and recent data on focus ---
  useFocusEffect(
    useCallback(() => {
      const fetchUpcomingContent = async () => {
        setLoadingUpcoming(true);
        try {
          const response = await getUpcomingScheduledContent();
          setUpcomingContent(response.data || []);
        } catch (error) {
          console.error("Error fetching upcoming content:", error);
        } finally {
          setLoadingUpcoming(false);
        }
      };

      const fetchRecentIdeas = async () => {
        setLoadingIdeas(true);
        try {
          const response = await getRecentIdeas();
          setRecentIdeas(response.data || []);
        } catch (error) {
          console.error("Error fetching recent ideas:", error);
        } finally {
          setLoadingIdeas(false);
        }
      };

      fetchUpcomingContent();
      fetchRecentIdeas();
    }, [])
  );

  // --- Refresh user usage stats on focus ---
  useFocusEffect(
    useCallback(() => {
      async function refreshUser() {
        try {
          const updatedUser = await getCurrentUserApi();
          useAuthStore.getState().setUser(updatedUser);
        } catch (error) {
          console.error("Failed to refresh user usage stats:", error);
        }
      }
      refreshUser();
    }, [])
  );

  // --- Handle Logout ---
  const handleLogout = () => {
    console.log("Logout button pressed");
    logout();
  };

  // --- Helper Functions ---
  const getInitials = (name: string | undefined): string => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    return names.length > 1 && names[names.length - 1]
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // --- Subscription Badge Configuration ---
  const subscriptionConfig = {
    free: { 
      label: "Free", 
      icon: "star-outline",
      backgroundColor: '#f97316',
      textColor: '#ffffff'
    },
    creator_pro: { 
      label: "Pro", 
      icon: "star-check",
      backgroundColor: '#10b981',
      textColor: '#ffffff'
    },
    agency_growth: { 
      label: "Agency", 
      icon: "crown",
      backgroundColor: '#3b82f6',
      textColor: '#ffffff'
    }
  };

  const subscription = user?.subscriptionTier || 'free';
  const subscriptionData = subscriptionConfig[subscription];

  // --- Navigation Functions ---
  const navigateToIdeation = () => navigation.navigate('Generate');
  const navigateToTrends = () => navigation.navigate('Trends');
  const navigateToSavedItems = () => navigation.navigate('SavedItems');
  const navigateToSEO = () => navigation.navigate('SEO');
  const navigateToCalendar = () => navigation.navigate('Calendar');
  const navigateToScripts = () => navigation.navigate('Scripts');
  
  const navigateToScheduledItem = (id: string) => {
    console.log("Navigating to scheduled item with ID:", id);
    navigation.navigate('Calendar', { screen: 'ScheduleDetail', params: { id }, initial: false });
  };
  
  const navigateToIdea = (id: string) => {
    console.log("Navigating to idea with ID:", id);
    navigation.navigate('SavedItems', { screen: 'IdeaDetail', params: { ideaId: id }, initial: false });
  };

  // --- Statistic Cards Data ---
  const monthlyStatsData = [
    { label: "Ideas Generated", value: user?.usage?.ideationsThisMonth || 0, icon: "lightbulb-on-outline", color: "#f59e0b" },
    { label: "Refinements", value: user?.usage?.refinementsThisMonth || 0, icon: "file-document-edit-outline", color: "#10b981" },
    { label: "SEO Reports", value: user?.usage?.seoReportsThisMonth || 0, icon: "magnify", color: "#3b82f6" },
    { label: "Scripts Created", value: user?.usage?.scriptsGeneratedThisMonth || 0, icon: "script-text-outline", color: "#8b5cf6" },
    { label: "Script Transforms", value: user?.usage?.scriptTransformationsThisMonth || 0, icon: "transfer", color: "#ec4899" },
    { label: "Insights Saved", value: user?.usage?.insightsSavedThisMonth || 0, icon: "bookmark-check-outline", color: "#06b6d4" }
  ];

  const dailyStatsData = [
    { label: "Searches Today", value: user?.usage?.dailySearchCount || 0, icon: "magnify", color: "#3b82f6" },
    { label: "SEO Analyses", value: user?.usage?.dailySeoAnalyses || 0, icon: "chart-line", color: "#10b981" },
    { label: "Insights Saved", value: user?.usage?.dailyInsightsSaved || 0, icon: "bookmark-plus-outline", color: "#8b5cf6" },
    { label: "Trend Ideations", value: user?.usage?.dailyTrendIdeations || 0, icon: "trending-up", color: "#f59e0b" }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* --- Header with User Info --- */}
        <Surface style={styles.headerSurface}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Text variant="headlineSmall" style={styles.welcomeText}>Welcome back,</Text>
              <View style={styles.nameRow}>
                <Text variant="headlineMedium" style={[styles.userName, { color: theme.colors.primary }]}>
                  {user?.name || 'Creator'}
                </Text>
                <View style={styles.subscriptionBadgeContainer}>
                  <View style={[styles.subscriptionBadge, { backgroundColor: subscriptionData.backgroundColor }]}>
                    <MaterialCommunityIcons
                      name={subscriptionData.icon}
                      size={16}
                      color={subscriptionData.textColor}
                      style={styles.subscriptionIcon}
                    />
                    <Text style={[styles.subscriptionText, { color: subscriptionData.textColor }]}>
                      {subscriptionData.label}
                    </Text>
                  </View>
                </View>
              </View>
              <Text variant="bodySmall" style={styles.dateText}>
                {currentDate} • {loadingLocation ? "Locating..." : location}
              </Text>
            </View>
            <View style={styles.avatarContainer}>
  <TouchableOpacity onPress={() => navigation.navigate('AccountSettings')}>
    {user?.profilePictureUrl ? (
      <Avatar.Image size={56} source={{ uri: user.profilePictureUrl }} style={styles.avatar} />
    ) : (
      <Avatar.Text
        size={56}
        label={getInitials(user?.name)}
        style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
        labelStyle={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}
      />
    )}
  </TouchableOpacity>
</View>
          </View>
        </Surface>

        {/* --- Stats Overview Section --- */}
        <View style={styles.sectionContainer}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Monthly Stats</Text>
          <View style={styles.statsCardsContainer}>
            {monthlyStatsData.map((stat, index) => (
              <Surface key={index} style={styles.statCard}>
                <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
                  <MaterialCommunityIcons name={stat.icon} size={24} color={stat.color} />
                </View>
                <Text variant="headlineSmall" style={styles.statValue}>{stat.value}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>{stat.label}</Text>
              </Surface>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Daily Stats</Text>
          <View style={styles.dailyStatsContainer}>
            {dailyStatsData.map((stat, index) => (
              <Surface key={index} style={styles.dailyStatCard}>
                <View style={styles.dailyStatContent}>
                  <View style={[styles.dailyIconContainer, { backgroundColor: `${stat.color}20` }]}>
                    <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <View style={styles.dailyStatInfo}>
                    <Text variant="bodyMedium" style={styles.dailyStatLabel}>{stat.label}</Text>
                    <Text variant="titleLarge" style={styles.dailyStatValue}>{stat.value}</Text>
                  </View>
                </View>
              </Surface>
            ))}
          </View>
        </View>

        {/* --- Calendar Snippet Area --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Coming Up This Week</Text>
            <IconButton 
              icon="calendar" 
              onPress={navigateToCalendar} 
              mode="contained" 
              containerColor={theme.colors.primaryContainer}
              iconColor={theme.colors.primary}
              size={20}
            />
          </View>
          <Surface style={styles.contentCard}>
            {loadingUpcoming ? (
              <ActivityIndicator style={{ margin: 20 }} />
            ) : upcomingContent.length > 0 ? (
              <>
                {upcomingContent.map((item) => (
                  <View key={item._id} style={styles.calendarItem}>
                    <View style={styles.dateChip}>
                      <Text variant="labelSmall">{formatDate(item.scheduledDate)}</Text>
                    </View>
                    <View style={styles.calendarItemContent}>
                      <Text variant="titleSmall" numberOfLines={1}>
                        {item.ideaId?.title || 'Untitled Content'}
                      </Text>
                      <Text variant="bodySmall" style={styles.platformText}>
                        {item.publishingPlatform}
                      </Text>
                    </View>
                    <IconButton 
                      icon="chevron-right" 
                      size={20} 
                      onPress={() => navigateToScheduledItem(item._id)}
                    />
                  </View>
                ))}
                <Button 
                  mode="text" 
                  onPress={navigateToCalendar} 
                  style={{ marginTop: 8 }}
                  labelStyle={{ color: theme.colors.primary }}
                >
                  View Full Calendar
                </Button>
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="calendar-blank" size={40} color="#D1D5DB" />
                <Text variant="bodyMedium" style={styles.emptyStateText}>No upcoming scheduled content</Text>
                <Button mode="outlined" onPress={navigateToCalendar} style={styles.emptyStateButton}>
                  Plan Your Content
                </Button>
              </View>
            )}
          </Surface>
        </View>

        {/* --- Recent Ideas Snippet Area --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Recent Ideas</Text>
            <IconButton 
              icon="lightbulb" 
              onPress={navigateToSavedItems} 
              mode="contained" 
              containerColor={theme.colors.primaryContainer}
              iconColor={theme.colors.primary}
              size={20}
            />
          </View>
          <Surface style={styles.contentCard}>
            {loadingIdeas ? (
              <ActivityIndicator style={{ margin: 20 }} />
            ) : recentIdeas.length > 0 ? (
              <>
                {recentIdeas.slice(0, 5).map((idea) => (
                  <View key={idea._id} style={styles.ideaItem}>
                    <View style={[styles.ideaIconContainer, { backgroundColor: '#f59e0b20' }]}>
                      <MaterialCommunityIcons name="lightbulb-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.ideaItemContent}>
                      <Text variant="titleSmall" numberOfLines={1}>{idea.title}</Text>
                      <Text variant="bodySmall" numberOfLines={1} style={styles.ideaAngle}>
                        {idea.angle}
                      </Text>
                    </View>
                    <IconButton icon="chevron-right" size={20} onPress={() => navigateToIdea(idea._id)} />
                  </View>
                ))}
                {recentIdeas.length > 5 && (
                  <Button 
                    mode="text" 
                    onPress={navigateToSavedItems} 
                    style={{ marginTop: 8 }}
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    View All Ideas
                  </Button>
                )}
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="lightbulb-outline" size={40} color="#D1D5DB" />
                <Text variant="bodyMedium" style={styles.emptyStateText}>No saved ideas yet</Text>
                <Button mode="contained" onPress={navigateToIdeation} style={styles.emptyStateButton}>
                  Generate Ideas
                </Button>
              </View>
            )}
          </Surface>
        </View>

        {/* --- Feature Access Grid --- */}
        <View style={styles.sectionContainer}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Your AI Toolkit</Text>
          <View style={styles.toolkitGrid}>
            {/* Ideation Card */}
            <TouchableOpacity onPress={navigateToIdeation} style={{ width: '48%' }}>
              <Surface style={styles.toolCard}>
                <View style={[styles.toolCardContent, { backgroundColor: 'rgba(251,146,60,0.1)' }]}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={32} color="#f97316" />
                  <Text variant="titleMedium" style={styles.toolCardTitle}>AI Ideation</Text>
                  <Text variant="bodySmall" style={styles.toolCardDescription}>Generate fresh content ideas</Text>
                </View>
              </Surface>
            </TouchableOpacity>

            {/* Trends Card */}
            <TouchableOpacity onPress={navigateToTrends} style={{ width: '48%' }}>
              <Surface style={styles.toolCard}>
                <View style={[styles.toolCardContent, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                  <MaterialCommunityIcons name="trending-up" size={32} color="#3b82f6" />
                  <Text variant="titleMedium" style={styles.toolCardTitle}>Trend Query</Text>
                  <Text variant="bodySmall" style={styles.toolCardDescription}>Explore latest trends & news</Text>
                </View>
              </Surface>
            </TouchableOpacity>

            {/* Saved Items Card */}
            <TouchableOpacity onPress={navigateToSavedItems} style={{ width: '48%' }}>
              <Surface style={styles.toolCard}>
                <View style={[styles.toolCardContent, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                  <MaterialCommunityIcons name="bookmark-multiple-outline" size={32} color="#8b5cf6" />
                  <Text variant="titleMedium" style={styles.toolCardTitle}>Saved Items</Text>
                  <Text variant="bodySmall" style={styles.toolCardDescription}>Ideas, Insights, Scripts</Text>
                </View>
              </Surface>
            </TouchableOpacity>

            {/* Calendar Card */}
            <TouchableOpacity onPress={navigateToCalendar} style={{ width: '48%' }}>
              <Surface style={styles.toolCard}>
                <View style={[styles.toolCardContent, { backgroundColor: 'rgba(236,72,153,0.1)' }]}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={32} color="#ec4899" />
                  <Text variant="titleMedium" style={styles.toolCardTitle}>Content Calendar</Text>
                  <Text variant="bodySmall" style={styles.toolCardDescription}>Plan your posting schedule</Text>
                </View>
              </Surface>
            </TouchableOpacity>

            {/* SEO Analyzer Card */}
            <TouchableOpacity onPress={navigateToSEO} style={{ width: '48%' }}>
              <Surface style={styles.toolCard}>
                <View style={[styles.toolCardContent, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                  <MaterialCommunityIcons name="magnify-scan" size={32} color="#10b981" />
                  <Text variant="titleMedium" style={styles.toolCardTitle}>SEO Analyzer</Text>
                  <Text variant="bodySmall" style={styles.toolCardDescription}>Optimize for discoverability</Text>
                </View>
              </Surface>
            </TouchableOpacity>

            {/* Scripts Card */}
            <TouchableOpacity onPress={navigateToScripts} style={{ width: '48%' }}>
              <Surface style={styles.toolCard}>
                <View style={[styles.toolCardContent, { backgroundColor: 'rgba(6,182,212,0.1)' }]}>
                  <MaterialCommunityIcons name="script-text-outline" size={32} color="#06b6d4" />
                  <Text variant="titleMedium" style={styles.toolCardTitle}>Script Hub</Text>
                  <Text variant="bodySmall" style={styles.toolCardDescription}>Generate & manage scripts</Text>
                </View>
              </Surface>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="logout" size={size} color={color} />
          )}
          textColor={theme.colors.error}
        >
          Log Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingVertical: 16, paddingHorizontal: 16 },
  headerSurface: { borderRadius: 16, marginBottom: 24, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  userName: { fontWeight: 'bold', marginRight: 12 },
  welcomeText: { color: '#6B7280', fontWeight: '500' },
  dateText: { color: '#6B7280', marginTop: 6 },
  avatarContainer: { marginLeft: 16 },
  avatar: { elevation: 4, borderWidth: 2, borderColor: 'white' },
  subscriptionBadgeContainer: { marginBottom: 4 },
  subscriptionBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, elevation: 2 },
  subscriptionIcon: { marginRight: 4 },
  subscriptionText: { fontSize: 12, fontWeight: 'bold' },
  sectionContainer: { marginBottom: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 12, color: '#1F2937' },
  statsCardsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', padding: 16, borderRadius: 16, marginBottom: 16, elevation: 2, alignItems: 'center' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontWeight: 'bold', fontSize: 24, color: '#1F2937' },
  statLabel: { color: '#6B7280', textAlign: 'center', marginTop: 4 },
  dailyStatsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dailyStatCard: { width: '48%', borderRadius: 16, marginBottom: 16, elevation: 2, overflow: 'hidden' },
  dailyStatContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  dailyIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dailyStatInfo: { flex: 1 },
  dailyStatLabel: { color: '#6B7280', marginBottom: 2, fontSize: 13 },
  dailyStatValue: { fontWeight: 'bold', color: '#1F2937' },
  contentCard: { borderRadius: 16, padding: 16, elevation: 2 },
  calendarItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dateChip: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 12, minWidth: 60, alignItems: 'center' },
  calendarItemContent: { flex: 1 },
  platformText: { color: '#6B7280', marginTop: 2 },
  ideaItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  ideaIconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  ideaItemContent: { flex: 1 },
  ideaAngle: { color: '#6B7280', marginTop: 2 },
  emptyStateContainer: { alignItems: 'center', padding: 24 },
  emptyStateText: { color: '#6B7280', marginTop: 12, marginBottom: 16 },
  emptyStateButton: { marginTop: 8 },
  toolkitGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  toolCard: { width: '100%', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 2 },
  toolCardContent: { padding: 20, alignItems: 'center', height: 140, justifyContent: 'center' },
  toolCardTitle: { marginTop: 12, fontWeight: '600', textAlign: 'center' },
  toolCardDescription: { marginTop: 4, textAlign: 'center', color: '#6B7280', fontSize: 12 },
  logoutButton: { marginTop: 8, marginBottom: 24, alignSelf: 'center', borderColor: '#EF4444', borderRadius: 30, borderWidth: 1.5, width: '60%' },
  logoutButtonContent: { paddingVertical: 6 },
  
});

export default DashboardScreen;
