// src/screens/app/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Text, Button, Card, useTheme, Avatar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUpcomingScheduledContent, getRecentIdeas, ScheduledContent, SavedIdea } from '../../services/dashboardService';
import * as Location from 'expo-location'; // Add this package via: npm install expo-location

// Define a proper type for usage stats
interface UsageStats {
  ideationsThisMonth?: number;
  scriptsGeneratedThisMonth?: number;
  seoReportsThisMonth?: number;
  [key: string]: any; // Allow for other properties
}

// Update User interface to include usage property with proper type
interface User {
  _id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  usage?: UsageStats;
  [key: string]: any; // Allow for other properties
}

export default function DashboardScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user) as User | null;
  const logout = useAuthStore((state) => state.logout);
  const navigation = useNavigation<any>();

  // State for dynamic content
  const [location, setLocation] = useState("Determining location...");
  const [upcomingContent, setUpcomingContent] = useState<ScheduledContent[]>([]);
  const [recentIdeas, setRecentIdeas] = useState<SavedIdea[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Get current date info
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // --- Get User Location ---
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation("Location access denied");
          setLoadingLocation(false);
          return;
        }

        let position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;
        
        // Get location name using reverse geocoding
        let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
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

  // --- Fetch Upcoming Content ---
  useEffect(() => {
    const fetchUpcomingContent = async () => {
      try {
        const response = await getUpcomingScheduledContent();
        setUpcomingContent(response.data || []);
      } catch (error) {
        console.error("Error fetching upcoming content:", error);
      } finally {
        setLoadingUpcoming(false);
      }
    };

    fetchUpcomingContent();
  }, []);

  // --- Fetch Recent Ideas ---
  useEffect(() => {
    const fetchRecentIdeas = async () => {
      try {
        const response = await getRecentIdeas();
        setRecentIdeas(response.data || []);
      } catch (error) {
        console.error("Error fetching recent ideas:", error);
      } finally {
        setLoadingIdeas(false);
      }
    };

    fetchRecentIdeas();
  }, []);

  // --- Handle Logout ---
  const handleLogout = () => {
    console.log("Logout button pressed");
    logout();
  };

  // --- Helper Functions ---
  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length > 1 && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    } else if (name.length > 0) {
      return name[0].toUpperCase();
    }
    return '?';
  };

  // Format date for calendar items
  const formatScheduleDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // --- Navigation Functions ---
  const navigateToIdeation = () => navigation.navigate('Generate');
  const navigateToTrends = () => navigation.navigate('Trends');
  const navigateToSavedItems = () => navigation.navigate('SavedItems');
  const navigateToSEO = () => navigation.navigate('SEO');
  const navigateToCalendar = () => navigation.navigate('Calendar');
  const navigateToScripts = () => navigation.navigate('Scripts');
  
  const navigateToScheduledItem = (id: string) => navigation.navigate('Calendar', { screen: 'ScheduleDetail', params: { id } });
  const navigateToIdea = (id: string) => navigation.navigate('SavedItems', { screen: 'IdeaDetail', params: { id } });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- Header --- */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.subtleText}>Welcome back,</Text>
            <Text variant="headlineLarge" style={[styles.userName, { color: theme.colors.primary }]}>
              {user?.name || 'Creator'}!
            </Text>
            <Text variant="bodySmall" style={styles.dateText}>
              {currentDate} - {loadingLocation ? "Locating..." : location}
            </Text>
          </View>
          
          {/* Avatar */}
          {user?.profilePictureUrl ? (
            <Avatar.Image size={48} source={{ uri: user.profilePictureUrl }} />
          ) : (
            <Avatar.Text
              size={48}
              label={getInitials(user?.name)}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              labelStyle={{color: theme.colors.onPrimaryContainer, fontWeight: 'bold'}}
            />
          )}
        </View>

        {/* --- Usage Stats Card --- */}
        <Card style={styles.sectionCard}>
          <Card.Title title="Your Stats This Month" titleVariant='titleMedium' />
          <Card.Content style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant='headlineMedium'>{user?.usage?.ideationsThisMonth || 0}</Text>
              <Text variant='bodySmall'>Ideas Generated</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant='headlineMedium'>{user?.usage?.scriptsGeneratedThisMonth || 0}</Text>
              <Text variant='bodySmall'>Scripts Created</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant='headlineMedium'>{user?.usage?.seoReportsThisMonth || 0}</Text>
              <Text variant='bodySmall'>SEO Reports</Text>
            </View>
          </Card.Content>
        </Card>

        {/* --- Calendar Snippet Area --- */}
        <Card style={styles.sectionCard}>
          <Card.Title 
            title="Coming Up This Week" 
            titleVariant='titleMedium'
            right={() => (
              <IconButton 
                icon="calendar" 
                onPress={navigateToCalendar} 
                mode="contained" 
                containerColor={theme.colors.primaryContainer}
                iconColor={theme.colors.primary}
                size={20}
                style={{marginRight: 16}}
              />
            )}
          />
          <Card.Content>
            {loadingUpcoming ? (
              <ActivityIndicator style={{margin: 20}} />
            ) : upcomingContent.length > 0 ? (
              <>
                {upcomingContent.map((item) => (
                  <View key={item._id} style={styles.calendarItem}>
                    <View style={styles.dateChip}>
                      <Text variant="labelSmall">{formatScheduleDate(item.scheduledDate)}</Text>
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
                <Button mode="text" onPress={navigateToCalendar} style={{marginTop: 8}}>View Full Calendar</Button>
              </>
            ) : (
              <>
                <Text variant='bodyMedium'>No upcoming scheduled content</Text>
                <Button mode="text" onPress={navigateToCalendar} style={{marginTop: 8}}>Plan Your Content</Button>
              </>
            )}
          </Card.Content>
        </Card>

        {/* --- Recent Ideas Snippet Area --- */}
        <Card style={styles.sectionCard}>
          <Card.Title 
            title="Recent Ideas" 
            titleVariant='titleMedium'
            right={() => (
              <IconButton 
                icon="lightbulb" 
                onPress={navigateToSavedItems} 
                mode="contained" 
                containerColor={theme.colors.primaryContainer}
                iconColor={theme.colors.primary}
                size={20}
                style={{marginRight: 16}}
              />
            )}
          />
          <Card.Content>
            {loadingIdeas ? (
              <ActivityIndicator style={{margin: 20}} />
            ) : recentIdeas.length > 0 ? (
              <>
                {recentIdeas.map((idea) => (
                  <View key={idea._id} style={styles.ideaItem}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={24} color={theme.colors.primary} />
                    <View style={styles.ideaItemContent}>
                      <Text variant="titleSmall" numberOfLines={1}>{idea.title}</Text>
                      <Text variant="bodySmall" numberOfLines={1}>{idea.angle}</Text>
                    </View>
                    <IconButton 
                      icon="chevron-right" 
                      size={20} 
                      onPress={() => navigateToIdea(idea._id)}
                    />
                  </View>
                ))}
                <Button mode="text" onPress={navigateToSavedItems} style={{marginTop: 8}}>View All Ideas</Button>
              </>
            ) : (
              <>
                <Text variant='bodyMedium'>No saved ideas yet</Text>
                <Button mode="text" onPress={navigateToIdeation} style={{marginTop: 8}}>Generate Ideas</Button>
              </>
            )}
          </Card.Content>
        </Card>

        {/* --- Feature Access Grid --- */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Your AI Toolkit</Text>
        <View style={styles.grid}>
          {/* Ideation Card */}
          <Card style={styles.card} onPress={navigateToIdeation}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={36} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>AI Ideation</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Generate fresh content ideas</Text>
            </Card.Content>
          </Card>

          {/* Trends Card */}
          <Card style={styles.card} onPress={navigateToTrends}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="trending-up" size={36} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Trend Query</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Explore latest trends & news</Text>
            </Card.Content>
          </Card>

          {/* Saved Items Card */}
          <Card style={styles.card} onPress={navigateToSavedItems}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="bookmark-multiple-outline" size={36} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Saved Items</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Ideas, Insights, Scripts</Text>
            </Card.Content>
          </Card>

          {/* Calendar Card */}
          <Card style={styles.card} onPress={navigateToCalendar}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="calendar-month-outline" size={36} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Content Calendar</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Plan your posting schedule</Text>
            </Card.Content>
          </Card>

          {/* SEO Card */}
          <Card style={styles.card} onPress={navigateToSEO}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="magnify-scan" size={36} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>SEO Analyzer</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Optimize for discoverability</Text>
            </Card.Content>
          </Card>

          {/* Scripts Card */}
          <Card style={styles.card} onPress={navigateToScripts}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="script-text-outline" size={36} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Script Hub</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Generate & manage scripts</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Logout Button */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
          textColor={theme.colors.error}
        >
          Log Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  userName: {
    fontWeight: 'bold',
  },
  dateText: {
    color: '#6B7280',
    marginTop: 4,
    fontSize: 12,
  },
  subtleText: {
    color: '#6B7280',
  },
  sectionCard: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    padding: 8,
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  calendarItemContent: {
    flex: 1,
  },
  platformText: {
    color: '#6B7280',
    marginTop: 2,
  },
  ideaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ideaItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#374151',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  card: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
    elevation: 2,
  },
  cardContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 24,
  },
  cardTitle: {
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardDescription: {
    marginTop: 4,
    textAlign: 'center',
    color: '#6B7280',
    minHeight: 35,
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 32,
    marginBottom: 32,
    alignSelf: 'center',
    borderColor: '#EF4444',
    borderWidth: 1,
    width: '60%',
  },
});