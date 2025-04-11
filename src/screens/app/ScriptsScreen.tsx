// src/screens/app/ScriptsScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  ScrollView 
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  useTheme, 
  ActivityIndicator, 
  Chip, 
  IconButton, 
  Searchbar, 
  FAB, 
  Menu, 
  Divider 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getUserScripts, deleteScript, Script } from '../../services/scriptService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ScriptsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  
  // State
  const [scripts, setScripts] = useState<Script[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});
  const [deleting, setDeleting] = useState<{ [key: string]: boolean }>({});
  
  // Fetch scripts when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchScripts();
    }, [])
  );
  
  // Handle search and filtering
  useEffect(() => {
    if (scripts.length === 0) return;
    
    let filtered = [...scripts];
    
    // Apply platform filter
    if (platformFilter) {
      filtered = filtered.filter(script => 
        script.platform.toLowerCase().includes(platformFilter.toLowerCase())
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        script => 
          script.title.toLowerCase().includes(query) ||
          script.platform.toLowerCase().includes(query) ||
          (script.tags && script.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    setFilteredScripts(filtered);
  }, [scripts, searchQuery, platformFilter]);
  
  // Fetch scripts
  const fetchScripts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUserScripts();
      const scriptsData = response.data || [];
      
      setScripts(scriptsData);
      setFilteredScripts(scriptsData);
    } catch (err) {
      console.error('Failed to fetch scripts:', err);
      setError('Failed to load scripts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchScripts();
  };
  
  // Handle delete
  const handleDeleteScript = async (scriptId: string) => {
    try {
      setDeleting({ ...deleting, [scriptId]: true });
      await deleteScript(scriptId);
      
      // Update local state
      setScripts(prevScripts => prevScripts.filter(script => script._id !== scriptId));
      setFilteredScripts(prevFiltered => prevFiltered.filter(script => script._id !== scriptId));
      
      // Close the menu
      setMenuVisible(prev => ({ ...prev, [scriptId]: false }));
    } catch (err) {
      console.error('Failed to delete script:', err);
      setError('Failed to delete script. Please try again.');
    } finally {
      setDeleting(prev => ({ ...prev, [scriptId]: false }));
    }
  };
  
  // Toggle menu
  const toggleMenu = (scriptId: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [scriptId]: !prev[scriptId]
    }));
  };
  
  // Navigation functions
  const navigateToScriptDetail = (scriptId: string) => {
    navigation.navigate('ScriptDetail', { scriptId });
  };
  
  const navigateToCreateScript = () => {
    navigation.navigate('CreateScript');
  };
  
  const navigateToTransformScript = (scriptId: string) => {
    navigation.navigate('TransformScript', { scriptId });
  };
  
  const navigateToEditScript = (scriptId: string) => {
    navigation.navigate('EditScript', { scriptId });
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper functions with explicit type annotations
  const getPlatformIcon = (platform: string): string => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('youtube')) return 'youtube';
    if (platformLower.includes('instagram')) return 'instagram';
    if (platformLower.includes('tiktok')) return 'music-note';
    if (platformLower.includes('linkedin')) return 'linkedin';
    if (platformLower.includes('twitter')) return 'twitter';
    if (platformLower.includes('facebook')) return 'facebook';
    return 'script-text-outline';
  };
  
  const formatPlatformName = (platform: string): string => {
    return platform
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const getScriptSummary = (script: Script): string => {
    const maxLength = 100;
    const intro = script.intro || '';
    return intro.length > maxLength ? `${intro.substring(0, maxLength)}...` : intro;
  };
  
  const uniquePlatforms = useMemo<string[]>(() => {
    if (scripts.length === 0) return [];
    const platforms = new Set<string>();
    scripts.forEach(script => {
      platforms.add(formatPlatformName(script.platform));
    });
    return Array.from(platforms).sort();
  }, [scripts]);
  
  // Render script card with improved layout
  const renderScriptCard = ({ item }: { item: Script }) => (
    <TouchableOpacity 
      onPress={() => navigateToScriptDetail(item._id)}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <View style={styles.cardContentWrapper}>
          {/* Card Header with Title and Menu */}
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {item.title}
              </Text>
            </View>
            <View>
              <IconButton 
                icon="dots-vertical" 
                size={24} 
                onPress={() => toggleMenu(item._id)} 
                style={styles.menuButton}
              />
              <Menu
                visible={menuVisible[item._id] || false}
                onDismiss={() => toggleMenu(item._id)}
                anchor={<View />}
              >
                <Menu.Item 
                  leadingIcon="pencil" 
                  onPress={() => {
                    toggleMenu(item._id);
                    navigateToEditScript(item._id);
                  }} 
                  title="Edit" 
                />
                <Menu.Item 
                  leadingIcon="format-list-group" 
                  onPress={() => {
                    toggleMenu(item._id);
                    navigateToTransformScript(item._id);
                  }} 
                  title="Transform" 
                />
                <Divider />
                <Menu.Item 
                  leadingIcon="delete" 
                  onPress={() => handleDeleteScript(item._id)}
                  title="Delete"
                  disabled={deleting[item._id]}
                  titleStyle={{ color: theme.colors.error }}
                />
              </Menu>
            </View>
          </View>
          
          {/* Platform Tags */}
          <View style={styles.platformContainer}>
            <Chip 
              icon={props => (
                <MaterialCommunityIcons 
                  name={getPlatformIcon(item.platform)}
                  size={16} 
                  color={theme.colors.primary} 
                />
              )}
              style={styles.platformChip}
            >
              {formatPlatformName(item.platform)}
            </Chip>
            
            {item.isTransformed && (
              <Chip 
                icon="transform" 
                style={styles.transformedChip}
              >
                Transformed
              </Chip>
            )}
          </View>
          
          {/* Script Summary */}
          <Text variant="bodySmall" numberOfLines={2} style={styles.descriptionText}>
            {getScriptSummary(item)}
          </Text>
          
          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <Text variant="bodySmall" style={styles.dateText}>
              {formatDate(item.createdAt)}
            </Text>
            {item.targetDuration && (
              <Chip 
                icon="clock-outline" 
                style={styles.durationChip}
                compact
              >
                {item.targetDuration}
              </Chip>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Script Hub</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search scripts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
      
      {/* Platform filter chips */}
      {uniquePlatforms.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            <Chip
              selected={platformFilter === null}
              onPress={() => setPlatformFilter(null)}
              style={styles.filterChip}
            >
              All Platforms
            </Chip>
            {uniquePlatforms.map(platform => (
              <Chip
                key={platform}
                selected={platformFilter === platform}
                onPress={() => setPlatformFilter(platform === platformFilter ? null : platform)}
                style={styles.filterChip}
                icon={props => (
                  <MaterialCommunityIcons
                    name={getPlatformIcon(platform)}
                    size={16}
                    color={platformFilter === platform ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                )}
              >
                {platform}
              </Chip>
            ))}
          </ScrollView>
          {platformFilter && (
            <Button
              mode="text"
              compact
              onPress={() => setPlatformFilter(null)}
              style={styles.clearButton}
            >
              Clear
            </Button>
          )}
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <Button mode="contained" onPress={fetchScripts} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading scripts...</Text>
        </View>
      ) : filteredScripts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="script-text-outline" 
            size={64} 
            color={theme.colors.primary} 
          />
          {searchQuery || platformFilter ? (
            <>
              <Text variant="titleMedium" style={styles.emptyTitle}>No matching scripts</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Try adjusting your search or filters
              </Text>
              <Button 
                mode="outlined" 
                onPress={() => {
                  setSearchQuery('');
                  setPlatformFilter(null);
                }}
                style={styles.emptyButton}
              >
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <Text variant="titleMedium" style={styles.emptyTitle}>No scripts yet</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Create scripts from your ideas for different platforms
              </Text>
              <Button 
                mode="contained" 
                onPress={navigateToCreateScript}
                style={styles.emptyButton}
                icon="plus"
              >
                Create Script
              </Button>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredScripts}
          renderItem={renderScriptCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.listFooter} />}
        />
      )}
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={navigateToCreateScript}
        color={theme.colors.onPrimary}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { 
    fontWeight: 'bold' 
  },
  searchContainer: { 
    paddingHorizontal: 16, 
    marginBottom: 8 
  },
  searchBar: { 
    elevation: 2 
  },
  filterContainer: { 
    marginBottom: 12 
  },
  filtersScrollContent: { 
    paddingHorizontal: 16, 
    paddingVertical: 4 
  },
  filterChip: { 
    marginRight: 8,
    marginVertical: 4 
  },
  clearButton: { 
    marginRight: 16,
    marginBottom: 4
  },
  listContent: { 
    padding: 16, 
    paddingBottom: 80 
  },
  card: { 
    marginBottom: 16, 
    elevation: 2, 
    borderRadius: 12,
    overflow: 'hidden'
  },
  cardContentWrapper: {
    padding: 16
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8
  },
  cardTitle: { 
    fontWeight: 'bold',
    flexWrap: 'wrap'
  },
  menuButton: {
    margin: 0,
    padding: 0
  },
  platformContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 12,
    marginTop: 4
  },
  platformChip: { 
    marginRight: 8, 
    marginBottom: 8,
    height: 32
  },
  transformedChip: { 
    marginBottom: 8,
    height: 32
  },
  descriptionText: { 
    marginBottom: 12,
    color: '#666'
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 4
  },
  dateText: { 
    color: '#6B7280' 
  },
  durationChip: { 
    height: 28
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    color: '#6B7280' 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  emptyTitle: { 
    marginTop: 16, 
    fontWeight: 'bold' 
  },
  emptyText: { 
    marginTop: 8, 
    color: '#6B7280', 
    textAlign: 'center' 
  },
  emptyButton: { 
    marginTop: 24 
  },
  errorContainer: { 
    padding: 16, 
    alignItems: 'center' 
  },
  errorText: { 
    marginBottom: 16 
  },
  retryButton: { 
    alignSelf: 'center' 
  },
  listFooter: { 
    height: 80 
  },
  footer: { 
    height: 40 
  },
  fab: { 
    position: 'absolute', 
    margin: 16, 
    right: 0, 
    bottom: 0 
  },
});

export default ScriptsScreen;