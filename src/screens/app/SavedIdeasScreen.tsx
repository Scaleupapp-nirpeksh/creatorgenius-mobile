// src/screens/app/SavedIdeasScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Share,
} from 'react-native';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  Button,
  useTheme,
  ActivityIndicator,
  Divider,
  IconButton,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getSavedIdeas, SavedIdea, deleteIdea } from '../../services/ideaService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SavedIdeasScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  // State
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});

  // Fetch ideas when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchIdeas();
    }, [])
  );

  // Handle search filtering
  useEffect(() => {
    if (ideas.length === 0) {
      setFilteredIdeas([]);
      return;
    }
    
    let filtered = [...ideas];
    if (selectedTag) {
      filtered = filtered.filter(idea => idea.tags.includes(selectedTag));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        idea =>
          idea.title.toLowerCase().includes(query) ||
          idea.angle.toLowerCase().includes(query) ||
          idea.tags.some(tag => tag.toLowerCase().includes(query)),
      );
    }
    setFilteredIdeas(filtered);
  }, [ideas, searchQuery, selectedTag]);

  // Extract unique tags for filtering
  useEffect(() => {
    if (ideas.length > 0) {
      const tags = new Set<string>();
      ideas.forEach(idea => {
        idea.tags.forEach(tag => tags.add(tag));
      });
      setUniqueTags(Array.from(tags).sort());
    }
  }, [ideas]);

  // Fetch ideas from API
  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSavedIdeas();
      setIdeas(response.data || []);
      setFilteredIdeas(response.data || []);
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
      setError('Failed to load ideas. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchIdeas();
  };

  // Handle search text changes
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle tag selection
  const onSelectTag = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  // Toggle the idea menu state for a given idea
  const toggleMenu = (ideaId: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [ideaId]: !prev[ideaId],
    }));
  };

  // Navigate to idea detail screen
  const navigateToDetail = (idea: SavedIdea) => {
    navigation.navigate('IdeaDetail', { ideaId: idea._id });
  };

  // Navigate to refine idea screen
  const navigateToRefine = (idea: SavedIdea) => {
    navigation.navigate('RefineIdea', { idea });
  };

  // Navigate to schedule screen
  const scheduleIdea = (idea: SavedIdea) => {
    navigation.navigate('Calendar', {
      screen: 'AddSchedule',
      params: { ideaId: idea._id, ideaTitle: idea.title },
    });
  };

  // Delete an idea
  const handleDeleteIdea = async (ideaId: string) => {
    try {
      await deleteIdea(ideaId);
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea._id !== ideaId));
      setMenuVisible(prev => ({ ...prev, [ideaId]: false }));
    } catch (err) {
      console.error('Failed to delete idea:', err);
      setError('Failed to delete idea. Please try again.');
    }
  };

  // Share an idea via the native Share API
  const handleShareIdea = async (idea: SavedIdea) => {
    try {
      const result = await Share.share({
        title: idea.title,
        message: `Check out this idea: "${idea.title}"\n\n${idea.angle}`,
      });
      if (result.action === Share.sharedAction) {
        console.log('Idea shared successfully!');
      }
    } catch (error) {
      console.error('Error sharing idea:', error);
    } finally {
      setMenuVisible(prev => ({ ...prev, [idea._id]: false }));
    }
  };

  // Navigate to edit idea screen
  const navigateToEdit = (idea: SavedIdea) => {
    navigation.navigate('EditIdea', { ideaId: idea._id });
  };

  // Format a date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Render idea card with custom header
  const renderIdeaCard = ({ item }: { item: SavedIdea }) => (
    <Card style={styles.card} onPress={() => navigateToDetail(item)}>
      {/* Custom Header with embedded Menu anchor */}
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        <Menu
          visible={menuVisible[item._id] || false}
          onDismiss={() => toggleMenu(item._id)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => toggleMenu(item._id)}
              style={styles.headerMenuIcon}
              iconColor={theme.colors.onSurfaceVariant}
            />
          }
        >
          <Menu.Item
            leadingIcon="lightbulb-outline"
            onPress={() => {
              toggleMenu(item._id);
              navigateToRefine(item);
            }}
            title="Refine Idea"
          />
          <Menu.Item
            leadingIcon="calendar-plus"
            onPress={() => {
              toggleMenu(item._id);
              scheduleIdea(item);
            }}
            title="Schedule"
          />
          <Menu.Item
            leadingIcon="share-variant"
            onPress={() => handleShareIdea(item)}
            title="Share Idea"
          />
          <Menu.Item
            leadingIcon="pencil-outline"
            onPress={() => {
              toggleMenu(item._id);
              navigateToEdit(item);
            }}
            title="Edit Idea"
          />
          
          <Divider />
          <Menu.Item
            leadingIcon="delete-outline"
            onPress={() => handleDeleteIdea(item._id)}
            title="Delete"
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      </View>
      <Card.Content>
        <Text variant="bodyMedium" numberOfLines={2} style={styles.angleText}>
          {item.angle}
        </Text>
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
        <View style={styles.cardFooter}>
          <Text variant="bodySmall" style={styles.dateText}>
            Saved on {formatDate(item.savedAt)}
          </Text>
          {item.platform_suitability && (
            <Chip
              style={[
                styles.suitabilityChip,
                item.platform_suitability === 'High'
                  ? styles.highSuitability
                  : item.platform_suitability === 'Medium'
                  ? styles.mediumSuitability
                  : styles.lowSuitability,
              ]}
              textStyle={styles.suitabilityText}
            >
              {item.platform_suitability}
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8F9FB' }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Saved Ideas
        </Text>
        <IconButton
          icon="plus"
          mode="contained"
          containerColor={theme.colors.primary}
          iconColor={theme.colors.onPrimary}
          size={24}
          onPress={() => navigation.navigate('Generate')}
          style={styles.addButton}
        />
      </View>

      <Searchbar
        placeholder="Search ideas..."
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
                  selectedTag === item && {
                    backgroundColor: theme.colors.primaryContainer,
                  },
                ]}
                textStyle={[
                  styles.filterTagText,
                  selectedTag === item && { color: theme.colors.primary },
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
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <Button mode="contained" onPress={fetchIdeas} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading ideas...</Text>
        </View>
      ) : filteredIdeas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="lightbulb-outline"
            size={64}
            color={theme.colors.primary}
          />
          {searchQuery || selectedTag ? (
            <>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No matching ideas
              </Text>
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
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No saved ideas yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Generate new content ideas and save them here for easy access
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Generate')}
                style={styles.emptyButton}
              >
                Generate Ideas
              </Button>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredIdeas}
          renderItem={renderIdeaCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={<View style={styles.listFooter} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  headerTitle: { fontWeight: 'bold' },
  addButton: { marginLeft: 8 },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  tagsScrollContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tagsScrollContent: { paddingHorizontal: 16 },
  filterTag: { marginRight: 8, marginVertical: 4, borderRadius: 16 },
  filterTagText: { fontSize: 12 },
  clearButton: { marginRight: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  titleContainer: { flex: 1, paddingRight: 8 },
  cardTitle: { fontWeight: '600', fontSize: 16, color: '#111827' },
  headerMenuIcon: { marginLeft: 'auto' },
  angleText: { marginTop: 4, marginBottom: 12, lineHeight: 20, color: '#374151' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  tag: { marginRight: 8, marginBottom: 8, borderRadius: 16 },
  tagText: { fontSize: 11 },
  moreTagsText: { color: '#6B7280', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  dateText: { color: '#9CA3AF', fontSize: 12 },
  suitabilityChip: { borderRadius: 16, paddingHorizontal: 8, paddingVertical: 2 },
  suitabilityText: { fontSize: 10, color: '#374151', fontWeight: '500' },
  highSuitability: { backgroundColor: '#D1FAE5' },
  mediumSuitability: { backgroundColor: '#FEF9C3' },
  lowSuitability: { backgroundColor: '#FFE4E6' },
  errorContainer: { padding: 16, alignItems: 'center' },
  errorText: { marginBottom: 16, textAlign: 'center' },
  retryButton: { alignSelf: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { marginTop: 16, fontWeight: 'bold', fontSize: 18 },
  emptyText: { marginTop: 8, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  emptyButton: { marginTop: 24, borderRadius: 20 },
  listFooter: { height: 72 },
});

export default SavedIdeasScreen;
