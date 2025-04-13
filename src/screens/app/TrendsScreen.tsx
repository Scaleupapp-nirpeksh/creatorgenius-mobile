// src/screens/app/TrendsScreen.tsx - UPDATED

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Linking,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  HelperText,
  useTheme,
  ActivityIndicator,
  Card,
  IconButton,
  Snackbar,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import {
  queryTrendsApi,
  saveSearchResultAsInsightApi,
  SearchResultItem,
  SaveInsightFromBodyInput,
  TrendsQueryResponse,
} from '../../services/apiClient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

//
// Create a memoized SearchHeader component so that it does not re-mount on every keystroke.
//

interface SearchHeaderProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

const SearchHeader = React.memo(
  ({ searchQuery, setSearchQuery, loading, onSubmit }: SearchHeaderProps) => {
    return (
      <View style={headerStyles.searchContainer}>
        <TextInput
          label="Search trends / news..."
          mode="outlined"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={headerStyles.searchInput}
          onSubmitEditing={onSubmit}
          disabled={loading}
          dense
        />
        <Button
          mode="contained"
          onPress={onSubmit}
          loading={loading && searchQuery.trim() !== ''}
          disabled={loading || !searchQuery.trim()}
          icon="magnify"
          style={headerStyles.searchButton}
          compact
        >
          Search
        </Button>
      </View>
    );
  }
);

const headerStyles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {},
});

//
// Main TrendsScreen Component
//

export default function TrendsScreen() {
  const theme = useTheme();
  const token = useAuthStore((state) => state.token);
  const navigation = useNavigation<any>();

  // State for the search input and API results
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [originalQueryForResults, setOriginalQueryForResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for the insight saving process
  const [savingStatus, setSavingStatus] = useState<{
    [key: number]: 'idle' | 'saving' | 'saved' | 'error';
  }>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Menu state for each result card
  const [menuVisible, setMenuVisible] = useState<{[key: number]: boolean}>({});

  // --- Handler for initiating a search ---
  const handleSearch = async () => {
    if (!token) {
      setError("Authentication needed.");
      return;
    }
    if (searchQuery.trim() === '') {
      setError("Please enter a search query.");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setSaveError(null);
    setResults([]);
    setSavingStatus({});
    setOriginalQueryForResults(searchQuery);

    try {
      console.log("Sending data to query API:", { query: searchQuery, saveAsInsight: false });
      const response: TrendsQueryResponse = await queryTrendsApi(searchQuery, false);
      console.log("Received API Response:", response);

      if (response.success && Array.isArray(response.data)) {
        setResults(response.data || []);
        console.log("Setting results:", response.data);
      } else {
        console.error("API response format unexpected or indicates failure:", response);
        setError(
          response.message?.includes('limit')
            ? response.message
            : "Failed to fetch trends or unexpected format."
        );
      }
    } catch (err: any) {
      console.error("Trends search catch block:", err);
      setError(
        err.message?.includes('limit')
          ? err.message
          : (err.message || "An error occurred during search.")
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Handler for saving a specific search result as an Insight ---
  const handleSaveInsight = useCallback(
    async (resultToSave: SearchResultItem, index: number) => {
      if (!token) {
        setSaveError("Authentication error.");
        setSnackbarMessage("Authentication error.");
        setSnackbarVisible(true);
        return;
      }
      // Prevent multiple clicks if already saving or saved
      if (savingStatus[index] === 'saving' || savingStatus[index] === 'saved') return;

      setSavingStatus((prev) => ({ ...prev, [index]: 'saving' }));
      setSaveError(null);

      // Find the index of the result that should be saved
      const originalIndex = results.findIndex(
        (r) => r.link === resultToSave.link && r.title === resultToSave.title
      );
      if (originalIndex === -1) {
        console.error("Save Error: Could not find original index for item:", resultToSave.title);
        setSavingStatus((prev) => ({ ...prev, [index]: 'error' }));
        const message = "Error: Could not identify result to save.";
        setSaveError(message);
        setSnackbarMessage(message);
        setSnackbarVisible(true);
        return;
      }

      // Prepare the data for the dedicated save endpoint
      const saveData: SaveInsightFromBodyInput = {
        resultIndex: originalIndex,
        query: originalQueryForResults,
        searchResults: results,
      };

      try {
        const response = await saveSearchResultAsInsightApi(saveData);
        if (response.success && response.data) {
          setSavingStatus((prev) => ({ ...prev, [index]: 'saved' }));
          setSnackbarMessage(`Insight Saved: "${response.data.title.substring(0, 30)}..."`);
        } else {
          throw new Error(response.message || "Failed to save insight");
        }
      } catch (err: any) {
        console.error("handleSaveInsight catch block error:", err);
        const message = err.message || "Could not save insight";
        setSavingStatus((prev) => ({ ...prev, [index]: 'error' }));
        setSaveError(message);
        setSnackbarMessage(message);
      } finally {
        setSnackbarVisible(true);
      }
    },
    [token, results, savingStatus, originalQueryForResults]
  );

  // --- Handler for navigating to generate ideas from trend ---
  const navigateToIdeation = (item: SearchResultItem, index: number) => {
    // Close the menu
    toggleMenu(index);
    
    // Create a trend object from the search result
    const trend = {
      _id: `temp_${Date.now()}`, // Temporary ID since this isn't stored yet
      title: item.title,
      content: {
        summary: item.snippet
      },
      source: {
        url: item.link,
        name: item.displayLink,
        query: originalQueryForResults
      }
    };
    
    // Navigate to the trend ideation screen
    navigation.navigate('TrendIdeation', { trend });
  };

  // --- Handler for opening links in the browser ---
  const openLink = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open URL:", err);
      Alert.alert("Error", "Could not open the link.");
    });
  };
  
  // Toggle menu for a result item
  const toggleMenu = (index: number) => {
    setMenuVisible(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // --- Render Functions ---

  const renderResultItem = ({ item, index }: { item: SearchResultItem; index: number }) => {
    const saveStatus = savingStatus[index] || 'idle';
    const iconMap = {
      saving: "progress-clock",
      saved: "check-circle",
      error: "alert-circle-outline",
      idle: "bookmark-plus-outline",
    };
    const iconColorMap = {
      saving: theme.colors.backdrop,
      saved: theme.colors.tertiary,
      error: theme.colors.error,
      idle: theme.colors.primary,
    };

    return (
      <Card style={styles.card}>
        <Card.Content>
          {/* Make title pressable */}
          <Text variant="titleMedium" style={{ color: theme.colors.primary }} onPress={() => openLink(item.link)}>
            {item.title}
          </Text>
          {/* Make display link pressable */}
          <Text variant="bodySmall" style={styles.linkText} onPress={() => openLink(item.link)}>
            {item.displayLink}
          </Text>
          {/* Snippet */}
          <Text variant="bodyMedium" style={styles.snippetText}>
            {item.snippet}
          </Text>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <View style={styles.actionLeft}>
            {/* Save Button/Icon */}
            <IconButton
              icon={iconMap[saveStatus]}
              iconColor={iconColorMap[saveStatus]}
              size={24}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              onPress={() => handleSaveInsight(item, index)}
            />
          </View>
          
          <View style={styles.actionRight}>
            {/* Visit Link Button */}
            <Button 
              mode="text" 
              onPress={() => openLink(item.link)} 
              compact
            >
              Visit Link
            </Button>
            
            {/* Menu Button */}
            <Menu
              visible={menuVisible[index] || false}
              onDismiss={() => toggleMenu(index)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => toggleMenu(index)}
                />
              }
            >
              <Menu.Item 
                leadingIcon="lightbulb-on-outline" 
                onPress={() => navigateToIdeation(item, index)} 
                title="Generate Ideas from This" 
              />
              <Menu.Item 
                leadingIcon={saveStatus === 'saved' ? "check" : "bookmark-plus-outline"}
                onPress={() => handleSaveInsight(item, index)}
                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                title={saveStatus === 'saved' ? "Already Saved" : "Save as Insight"} 
              />
            </Menu>
          </View>
        </Card.Actions>
      </Card>
    );
  };

  const renderEmptyComponent = () => {
    if (loading && results.length === 0)
      return <ActivityIndicator style={styles.loadingIndicator} size="large" />;
    if (error)
      return (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      );
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="compass-outline" size={64} color={theme.colors.backdrop} />
        <Text style={styles.emptyText}>
          Enter a query above to search for trends or news.
        </Text>
        <Text style={styles.emptySubText}>
          e.g., "AI video tools", "Zomato news", "latest fashion trends India"
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (!results.length) return null;
    
    return (
      <View style={styles.resultsHeader}>
        <Text variant="titleMedium">Results for "{originalQueryForResults}"</Text>
        <Button 
          mode="text" 
          icon="lightbulb-on-outline" 
          onPress={() => {
            // Create a trend object from the search query
            const trend = {
              _id: `temp_${Date.now()}`, // Temporary ID
              title: `Search: ${originalQueryForResults}`,
              content: {
                summary: `Search results for: ${originalQueryForResults}`
              },
              source: {
                query: originalQueryForResults
              }
            };
            
            // Navigate to the trend ideation screen
            navigation.navigate('TrendIdeation', { trend });
          }}
          compact
        >
          Generate Ideas from Search
        </Button>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen Header */}
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.pageTitle}>
          Explore Trends & News
        </Text>
        
        {/* Header buttons for navigation */}
        <View style={styles.headerButtonsContainer}>
          <Button 
            mode="outlined" 
            icon="bookmark-multiple" 
            onPress={() => navigation.navigate('SavedTrends')}
            compact
            style={styles.headerButton}
          >
            Saved Trends
          </Button>
        </View>
      </View>
      
      {/* Render the SearchHeader component above the FlatList */}
      <SearchHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loading={loading}
        onSubmit={handleSearch}
      />
      
      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={(item, index) => item.link + index}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={saveError ? { backgroundColor: theme.colors.errorContainer } : {}}
        theme={saveError ? { colors: { inverseSurface: theme.colors.onErrorContainer } } : {}}
        action={{
          label: 'Dismiss',
          onPress: () => {
            setSnackbarVisible(false);
          },
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

//
// Styles
//

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
  },
  pageTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  headerButton: {
    marginHorizontal: 4,
  },
  errorText: {
    textAlign: 'center',
    margin: 16,
    fontSize: 14,
    paddingBottom: 10,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 30,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultsHeader: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  card: {
    marginVertical: 8,
    elevation: 1,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 6,
  },
  snippetText: {
    color: '#4B5563',
    lineHeight: 18,
  },
  cardActions: {
    justifyContent: 'space-between',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});