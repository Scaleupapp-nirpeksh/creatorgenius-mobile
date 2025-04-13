// src/screens/app/SavedTrendsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, Chip, IconButton, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getInsightsApi, deleteInsightApi, Insight } from '../../services/apiClient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SavedTrendsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  // State
  const [trends, setTrends] = useState<Insight[]>([]);
  const [filteredTrends, setFilteredTrends] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);

  // Fetch trends when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchTrends();
    }, [])
  );

  // Handle search filtering
  useEffect(() => {
    if (trends.length === 0) return;

    let filtered = [...trends];
    if (selectedTag) {
      filtered = filtered.filter(trend => trend.tags?.includes(selectedTag));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        trend =>
          trend.title.toLowerCase().includes(query) ||
          (trend.content?.summary?.toLowerCase().includes(query)) ||
          (trend.tags && trend.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    setFilteredTrends(filtered);
  }, [trends, searchQuery, selectedTag]);

  // Extract unique tags for filtering
  useEffect(() => {
    if (trends.length > 0) {
      const tags = new Set<string>();
      trends.forEach(trend => {
        if (trend.tags) {
          trend.tags.forEach(tag => tags.add(tag));
        }
      });
      setUniqueTags(Array.from(tags).sort());
    }
  }, [trends]);

  // Fetch trends
  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getInsightsApi({ type: 'search_result' });
      if (response.success) {
        setTrends(response.data || []);
        setFilteredTrends(response.data || []);
      } else {
        setError(response.message || 'Failed to load saved trends.');
      }
    } catch (err) {
      console.error('Failed to fetch saved trends:', err);
      setError('Failed to load saved trends. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTrends();
  };

  // Handle search text change
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle tag selection
  const onSelectTag = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  // Handle delete trend with confirmation
  const handleDeleteTrend = (trendId: string, trendTitle: string) => {
    Alert.alert(
      'Delete Saved Trend',
      `Are you sure you want to delete "${trendTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteInsightApi(trendId);
              if (response.success) {
                setTrends(prevTrends => prevTrends.filter(trend => trend._id !== trendId));
                setFilteredTrends(prevFiltered => prevFiltered.filter(trend => trend._id !== trendId));
              } else {
                Alert.alert('Error', response.message || 'Failed to delete trend.');
              }
            } catch (err) {
              console.error(`Failed to delete trend ${trendId}:`, err);
              Alert.alert('Error', 'Failed to delete trend. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle open original link
  const handleOpenLink = (url: string) => {
    if (!url) return;
    navigation.navigate('WebView', { url, title: 'Trend Source' });
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Calculate time difference for display
  const getTimeAgo = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };

  // Render a single trend card
  const renderTrendCard = ({ item }: { item: Insight }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>{item.title}</Text>

        {item.source?.name && (
          <Text variant="bodySmall" style={styles.sourceText}>
            Source: {item.source.name}
          </Text>
        )}

        {item.content?.summary && (
          <Text variant="bodyMedium" style={styles.summaryText} numberOfLines={3}>
            {getTimeAgo(item.createdAt)} ... {item.content.summary}
          </Text>
        )}

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <Chip 
                key={index} 
                onPress={() => onSelectTag(tag)}
                style={styles.tag}
                textStyle={styles.tagText}
                compact
              >
                {tag}
              </Chip>
            ))}
            {item.tags.length > 3 && (
              <Text variant="bodySmall" style={styles.moreTagsText}>
                +{item.tags.length - 3} more
              </Text>
            )}
          </View>
        )}

        <Text variant="bodySmall" style={styles.dateText}>
          Saved on {formatDate(item.createdAt)}
        </Text>
      </Card.Content>

      {/* Updated Button Row for better UX/UI */}
      <View style={styles.buttonRow}>
        {item.source?.url && (
          <Button
            mode="outlined"
            icon="earth"
            onPress={() => handleOpenLink(item.source?.url || '')}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.compactLabel}
            compact
          >
            View Source
          </Button>
        )}

        <Button
          mode="outlined"
          icon="lightbulb-on-outline"
          onPress={() => navigation.navigate('TrendIdeation', { trend: item })}
          style={styles.actionButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.compactLabel}
          compact
        >
          Generate Ideas
        </Button>

        <IconButton
          icon="delete-outline"
          onPress={() => handleDeleteTrend(item._id, item.title)}
          size={24}
          iconColor={theme.colors.error}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Saved Trends</Text>
      </View>

      <Searchbar
        placeholder="Search saved trends..."
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      {uniqueTags.length > 0 && (
        <View style={styles.tagsScrollContainer}>
          <FlatList
            horizontal
            data={uniqueTags}
            renderItem={({ item }) => (
              <Chip
                selected={selectedTag === item}
                onPress={() => onSelectTag(item)}
                style={[
                  styles.filterTag,
                  selectedTag === item && { backgroundColor: theme.colors.primaryContainer }
                ]}
                textStyle={[
                  styles.filterTagText,
                  selectedTag === item && { color: theme.colors.primary }
                ]}
                showSelectedCheck={false}
              >
                {item}
              </Chip>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsScrollContent}
          />
          {selectedTag && (
            <Button
              mode="text"
              compact
              onPress={() => setSelectedTag(null)}
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
          <Button mode="contained" onPress={fetchTrends} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading saved trends...</Text>
        </View>
      ) : filteredTrends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="magnify" size={64} color={theme.colors.primary} />
          {searchQuery || selectedTag ? (
            <>
              <Text variant="titleMedium" style={styles.emptyTitle}>No matching trends</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Try adjusting your search or filters
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                }}
                style={styles.emptyButton}
              >
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <Text variant="titleMedium" style={styles.emptyTitle}>No saved trends yet</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Search for trends and save them to see them here
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Trends')}
                style={styles.emptyButton}
              >
                Explore Trends
              </Button>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredTrends}
          renderItem={renderTrendCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.footer} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  tagsScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagsScrollContent: {
    paddingHorizontal: 16,
  },
  filterTag: {
    marginRight: 8,
  },
  filterTagText: {
    fontSize: 12,
  },
  clearButton: {
    marginRight: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sourceText: {
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryText: {
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
  },
  moreTagsText: {
    color: '#6B7280',
  },
  dateText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonContent: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  compactLabel: {
    fontSize: 10,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 16,
  },
  retryButton: {
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
  },
  footer: {
    height: 40,
  },
});

export default SavedTrendsScreen;
