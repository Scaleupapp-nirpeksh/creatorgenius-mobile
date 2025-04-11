// src/screens/app/DashboardScreen.tsx
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button, Card, useTheme, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore'; // Import store
import { useNavigation } from '@react-navigation/native'; // Import hook for navigation
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define type for navigation actions within this screen context if needed
// import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
// import { AppTabParamList } from '../../navigation/types';
// type DashboardNavigationProp = BottomTabNavigationProp<AppTabParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
const logout = useAuthStore((state) => state.logout);
  // Use hook for navigation actions
  const navigation = useNavigation();

  const handleLogout = () => {
    logout();
    // Navigation back to Auth stack happens automatically via RootNavigator
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Get current date info (client-side)
  const currentDate = new Date().toLocaleDateString('en-IN', {
       weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });


  // --- Placeholder Navigation Functions ---
  // Replace these with actual navigation calls when screens exist
  const navigateToIdeation = () => navigation.navigate('Generate' as never); // Cast 'as never' if screen isn't typed yet
  const navigateToTrends = () => console.log("Navigate to Trends Query"); // Placeholder
  const navigateToSavedItems = () => console.log("Navigate to Saved Items"); // Placeholder
  const navigateToSEO = () => console.log("Navigate to SEO Tool"); // Placeholder
  const navigateToCalendar = () => navigation.navigate('Calendar' as never); // Cast 'as never'
  const navigateToScripts = () => console.log("Navigate to Scripts"); // Placeholder
  // --- End Placeholders ---


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- Header --- */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall">Welcome back,</Text>
            <Text variant="headlineLarge" style={{ color: theme.colors.primary }}>
              {user?.name || 'Creator'}!
            </Text>
             <Text variant="bodySmall" style={styles.dateText}>
                {currentDate} 
             </Text>
          </View>
          {/* Basic Avatar - Replace with Image later if profilePictureUrl exists */}
          <Avatar.Text size={48} label={getInitials(user?.name)} style={{ backgroundColor: theme.colors.primaryContainer }} labelStyle={{color: theme.colors.onPrimaryContainer}}/>
        </View>

        {/* --- Quick Stats / Calendar Snippet Area (Placeholder) --- */}
        {/* <Card style={styles.card}>
            <Card.Title title="This Week's Schedule" />
            <Card.Content>
                <Text>Calendar snippet coming soon...</Text>
            </Card.Content>
        </Card> */}

        {/* --- Personalized Trends/News Snippet Area (Placeholder) --- */}
        {/* <Card style={styles.card}>
            <Card.Title title="Trends for You" />
            <Card.Content>
                <Text>Personalized trends coming soon...</Text>
            </Card.Content>
        </Card> */}


        {/* --- Feature Access Grid --- */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Your Tools</Text>
        <View style={styles.grid}>
          {/* Ideation Card */}
          <Card style={styles.card} onPress={navigateToIdeation}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={32} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>AI Ideation</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Generate fresh content ideas</Text>
            </Card.Content>
          </Card>

          {/* Trends Card */}
          <Card style={styles.card} onPress={navigateToTrends}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="trending-up" size={32} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Trend Query</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Explore latest trends & news</Text>
            </Card.Content>
          </Card>

           {/* Saved Items Card */}
           <Card style={styles.card} onPress={navigateToSavedItems}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="bookmark-multiple-outline" size={32} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Saved Items</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Ideas, Insights, Scripts</Text>
            </Card.Content>
          </Card>

          {/* Calendar Card */}
          <Card style={styles.card} onPress={navigateToCalendar}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="calendar-month-outline" size={32} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Content Calendar</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Plan your posting schedule</Text>
            </Card.Content>
          </Card>

          {/* SEO Card */}
          <Card style={styles.card} onPress={navigateToSEO}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="magnify-scan" size={32} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>SEO Analyzer</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Optimize for discoverability</Text>
            </Card.Content>
          </Card>

          {/* Scripts Card */}
           <Card style={styles.card} onPress={navigateToScripts}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons name="script-text-outline" size={32} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Script Hub</Text>
              <Text variant="bodySmall" style={styles.cardDescription}>Generate & manage scripts</Text>
            </Card.Content>
          </Card>

        </View>

        {/* Logout Button (Could move to Profile later) */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
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
    padding: 16, // Padding for scrollable area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    color: '#6B7280', // Secondary text color
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 16, // Space above grid title
    marginBottom: 12,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%', // Roughly two cards per row
    marginBottom: 16,
    // backgroundColor: 'white', // Default card background
  },
  cardContent: {
      alignItems: 'center', // Center icon and text
      paddingVertical: 20,
  },
  cardTitle: {
      marginTop: 12,
      fontWeight: 'bold',
      textAlign: 'center'
  },
  cardDescription: {
      marginTop: 4,
      textAlign: 'center',
      color: '#6B7280', // Secondary text color
      minHeight: 30, // Give some space for description
  },
  logoutButton: {
    marginTop: 40,
    marginBottom: 20,
    alignSelf: 'center', // Center the logout button
    borderColor: '#EF4444' // Use error color outline
  }
});