// src/screens/app/SavedSeoInsightsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, Chip, IconButton, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getInsightsApi, deleteInsightApi, Insight } from '../../services/apiClient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SavedSeoInsightsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  // State
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);

  // Fetch insights when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchInsights();
    }, [])
  );

  // Handle search filtering
  useEffect(() => {
    if (insights.length === 0) return;

    let filtered = [...insights];
    if (selectedTag) {
      filtered = filtered.filter(insight => insight.tags?.includes(selectedTag));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        insight =>
          insight.title.toLowerCase().includes(query) ||
          (insight.content?.summary?.toLowerCase().includes(query)) ||
          (insight.tags && insight.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    setFilteredInsights(filtered);
  }, [insights, searchQuery, selectedTag]);

  // Extract unique tags for filtering
  useEffect(() => {
    if (insights.length > 0) {
      const tags = new Set<string>();
      insights.forEach(insight => {
        if (insight.tags) {
          insight.tags.forEach(tag => tags.add(tag));
        }
      });
      setUniqueTags(Array.from(tags).sort());
    }
  }, [insights]);

  // Fetch insights
  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getInsightsApi({ type: 'seo_result' });
      if (response.success) {
        setInsights(response.data || []);
        setFilteredInsights(response.data || []);
      } else {
        setError(response.message || 'Failed to load saved SEO insights.');
      }
    } catch (err) {
      console.error('Failed to fetch saved SEO insights:', err);
      setError('Failed to load saved SEO insights. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchInsights();
  };

  // Handle search text change
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle tag selection
  const onSelectTag = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  // Handle delete insight with confirmation
  const handleDeleteInsight = (insightId: string, insightTitle: string) => {
    Alert.alert(
      'Delete Saved SEO Analysis',
      `Are you sure you want to delete "${insightTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteInsightApi(insightId);
              if (response.success) {
                setInsights(prevInsights => prevInsights.filter(insight => insight._id !== insightId));
                setFilteredInsights(prevFiltered => prevFiltered.filter(insight => insight._id !== insightId));
              } else {
                Alert.alert('Error', response.message || 'Failed to delete SEO insight.');
              }
            } catch (err) {
              console.error(`Failed to delete insight ${insightId}:`, err);
              Alert.alert('Error', 'Failed to delete insight. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Render a single insight card
  const renderInsightCard = ({ item }: { item: Insight }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('SeoInsightDetail', { insightId: item._id })}
    >
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>{item.title}</Text>
  
        {/* Display keywords */}
        {item.content?.suggestedKeywords && (
          <View style={styles.keywordsContainer}>
            <Text variant="bodySmall" style={styles.sectionLabel}>Keywords:</Text>
            <View style={styles.tagsContainer}>
              {item.content.suggestedKeywords.slice(0, 5).map((keyword: string, index: number) => (
                <Chip 
                  key={index} 
                  style={styles.keywordChip}
                  textStyle={styles.chipText}
                  compact
                >
                  {keyword}
                </Chip>
              ))}
              {item.content.suggestedKeywords.length > 5 && (
                <Text variant="bodySmall" style={styles.moreItemsText}>
                  +{item.content.suggestedKeywords.length - 5} more
                </Text>
              )}
            </View>
          </View>
        )}
  
        {/* Display optimized titles */}
        {item.content?.optimizedTitles && item.content.optimizedTitles.length > 0 && (
          <View style={styles.titlesContainer}>
            <Text variant="bodySmall" style={styles.sectionLabel}>Suggested Title:</Text>
            <Text variant="bodyMedium" style={styles.titleText}>
              {item.content.optimizedTitles[0]}
            </Text>
          </View>
        )}
  
        {/* Display tags */}
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
      <Card.Actions>
        <Button
          mode="text"
          onPress={() => navigation.navigate('SeoAnalysis')}
          icon="magnify"
          compact
        >
          New Analysis
        </Button>
        <IconButton
          icon="delete-outline"
          onPress={() => handleDeleteInsight(item._id, item.title)}
          size={20}
          iconColor={theme.colors.error}
        />
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>Saved SEO Insights</Text>
        <View style={{ width: 48 }} />
      </View>

      <Searchbar
        placeholder="Search saved insights..."
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
          <Button mode="contained" onPress={fetchInsights} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading saved SEO insights...</Text>
        </View>
      ) : filteredInsights.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-search-outline" size={64} color={theme.colors.primary} />
          {searchQuery || selectedTag ? (
            <>
              <Text variant="titleMedium" style={styles.emptyTitle}>No matching insights</Text>
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
              <Text variant="titleMedium" style={styles.emptyTitle}>No saved SEO insights yet</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Run SEO analysis and save them to see them here
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('SEO')}
                style={styles.emptyButton}
              >
                Analyze SEO
              </Button>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredInsights}
          renderItem={renderInsightCard}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
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
    marginBottom: 12,
  },
  sectionLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#6B7280',
  },
  keywordsContainer: {
    marginBottom: 12,
  },
  titlesContainer: {
    marginBottom: 12,
  },
  titleText: {
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  keywordChip: {
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#E0F7FA',
  },
  tag: {
    marginRight: 4,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 10,
  },
  tagText: {
    fontSize: 10,
  },
  moreTagsText: {
    color: '#6B7280',
    fontSize: 12,
  },
  moreItemsText: {
    color: '#6B7280',
    fontSize: 12,
    marginLeft: 4,
    alignSelf: 'center',
  },
  dateText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
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

export default SavedSeoInsightsScreen;