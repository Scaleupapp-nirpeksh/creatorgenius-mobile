// src/screens/app/SeoInsightDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  ActivityIndicator,
  Chip,
  IconButton,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { getInsightByIdApi, Insight } from '../../services/apiClient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type SeoInsightDetailRouteProp = RouteProp<
  { SeoInsightDetail: { insightId: string } },
  'SeoInsightDetail'
>;

const SeoInsightDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<SeoInsightDetailRouteProp>();
  const { insightId } = route.params;

  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsightDetails();
  }, [insightId]);

  const fetchInsightDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getInsightByIdApi(insightId);
      if (response.success && response.data) {
        setInsight(response.data);
      } else {
        setError(response.message || 'Failed to load SEO insight details');
      }
    } catch (err) {
      console.error('Error fetching SEO insight details:', err);
      setError('Failed to load insight details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date to a readable string
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Create a new SEO analysis using this insight's data as a starting point
  const handleCreateNewAnalysis = () => {
    if (!insight || !insight.content) return;
    const seoData = insight.content;
    const sourceQuery = insight.source?.query || '';
    // Navigate to the SeoAnalysis screen with prefilled data
    navigation.navigate('SeoAnalysis', {
      prefillData: {
        topic: sourceQuery,
        currentTitle: seoData.optimizedTitles && seoData.optimizedTitles.length > 0 ? seoData.optimizedTitles[0] : '',
        keywords: seoData.suggestedKeywords ? seoData.suggestedKeywords.join(', ') : ''
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading SEO insight details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !insight) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={styles.headerTitle}>Error</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error || 'Failed to load SEO insight details'}
          </Text>
          <Button mode="contained" onPress={fetchInsightDetails} style={styles.retryButton}>
            Retry
          </Button>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Extract SEO data from insight content
  const seoData = insight.content;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
          SEO Insight Details
        </Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="headlineMedium" style={styles.title}>{insight.title}</Text>
        <View style={styles.metaInfo}>
          <Text variant="bodySmall" style={styles.dateText}>
            Saved on {formatDate(insight.createdAt)}
          </Text>
          {insight.source?.query && (
            <Text variant="bodySmall" style={styles.sourceText}>
              Source: {insight.source.query}
            </Text>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Tags */}
        {insight.tags && insight.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {insight.tags.map((tag: string, index: number) => (
              <Chip key={index} style={styles.tag}>
                {tag}
              </Chip>
            ))}
          </View>
        )}

        {/* Suggested Keywords */}
        {seoData.suggestedKeywords && seoData.suggestedKeywords.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Suggested Keywords" 
              left={props => <MaterialCommunityIcons {...props} name="key-variant" size={24} color={theme.colors.primary} />}
            />
            <Card.Content>
              <View style={styles.keywordsContainer}>
                {seoData.suggestedKeywords.map((keyword: string, index: number) => (
                  <Chip key={index} style={styles.keywordChip}>
                    {keyword}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Optimized Titles */}
        {seoData.optimizedTitles && seoData.optimizedTitles.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Optimized Titles" 
              left={props => <MaterialCommunityIcons {...props} name="format-title" size={24} color={theme.colors.primary} />}
            />
            <Card.Content>
              {seoData.optimizedTitles.map((title: string, index: number) => (
                <View key={index} style={styles.titleItem}>
                  <Text variant="bodyMedium">{index + 1}. {title}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Optimized Description */}
        {seoData.optimizedDescription && (
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Optimized Description" 
              left={props => <MaterialCommunityIcons {...props} name="text-box-outline" size={24} color={theme.colors.primary} />}
            />
            <Card.Content>
              <Text variant="bodyMedium">{seoData.optimizedDescription}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Suggested Hashtags */}
        {seoData.suggestedHashtags && seoData.suggestedHashtags.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Suggested Hashtags" 
              left={props => <MaterialCommunityIcons {...props} name="pound" size={24} color={theme.colors.primary} />}
            />
            <Card.Content>
              <View style={styles.hashtagsContainer}>
                {seoData.suggestedHashtags.map((hashtag: string, index: number) => (
                  <Chip key={index} style={styles.hashtagChip}>
                    #{hashtag}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Content Feedback */}
        {seoData.contentFeedback && (
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Content Feedback" 
              left={props => <MaterialCommunityIcons {...props} name="message-text-outline" size={24} color={theme.colors.primary} />}
            />
            <Card.Content>
              <Text variant="bodyMedium">{seoData.contentFeedback}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Notes */}
        {insight.notes && (
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Your Notes" 
              left={props => <MaterialCommunityIcons {...props} name="note-text-outline" size={24} color={theme.colors.primary} />}
            />
            <Card.Content>
              <Text variant="bodyMedium">{insight.notes}</Text>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          onPress={handleCreateNewAnalysis}
          style={styles.actionButton}
          icon="plus"
        >
          Create New Analysis Based on This
        </Button>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: 'bold' },
  headerRightPlaceholder: { width: 48 },
  title: { fontWeight: 'bold', marginBottom: 8 },
  metaInfo: { marginBottom: 16 },
  dateText: { color: '#6B7280' },
  sourceText: { color: '#6B7280', marginTop: 4 },
  divider: { marginBottom: 16 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tag: { margin: 4 },
  sectionCard: { marginBottom: 16 },
  keywordsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  keywordChip: { margin: 4 },
  hashtagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  hashtagChip: { margin: 4, backgroundColor: '#E0F7FA' },
  titleItem: { marginBottom: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { marginTop: 8, marginBottom: 16, textAlign: 'center' },
  retryButton: { marginBottom: 12 },
  backButton: { marginTop: 8 },
  actionButton: { marginTop: 8, marginBottom: 24 },
  footer: { height: 40 },
});

export default SeoInsightDetailScreen;
