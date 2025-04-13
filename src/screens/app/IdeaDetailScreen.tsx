// src/screens/app/IdeaDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Text, Card, Chip, Button, useTheme, ActivityIndicator, Divider, IconButton, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { getSavedIdea, SavedIdea, deleteIdea, getRefinementsForIdea, IdeaRefinement } from '../../services/ideaService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ParamList = {
  IdeaDetail: { ideaId: string };
};

const IdeaDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'IdeaDetail'>>();
  const { ideaId } = route.params;
  
  // State
  const [idea, setIdea] = useState<SavedIdea | null>(null);
  const [refinements, setRefinements] = useState<IdeaRefinement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Fetch idea details and refinements when ideaId changes
  useEffect(() => {
    fetchIdeaDetail();
  }, [ideaId]);
  
  const fetchIdeaDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch idea details
      const ideaResponse = await getSavedIdea(ideaId);
      setIdea(ideaResponse.data);
      // Fetch refinements
      const refinementsResponse = await getRefinementsForIdea(ideaId);
      setRefinements(refinementsResponse.data || []);
    } catch (err) {
      console.error('Failed to fetch idea details:', err);
      setError('Failed to load idea details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format a date string to a readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Navigation and Action Functions
  const navigateToRefine = () => {
    if (idea) {
      navigation.navigate('RefineIdea', { idea });
    }
  };

  const scheduleIdea = () => {
    if (idea) {
      navigation.navigate('Calendar', { 
        screen: 'AddSchedule', 
        params: { ideaId: idea._id, ideaTitle: idea.title } 
      });
    }
  };

  const navigateToSeo = () => {
    if (!idea) return;
    navigation.navigate('SEO', {
      screen: 'SeoAnalysis',
      params: { 
        prefillData: {
          topic: idea.title,
          currentTitle: idea.title,
          currentDescription: idea.angle,
          keywords: idea.tags.join(', '),
          contentText: idea.hook || ''
        },
        ideaId: idea._id
      }
    });
  };

  const handleShareIdea = async () => {
    if (!idea) return;
    try {
      const shareText = `${idea.title}\n\nAngle: ${idea.angle}\n\n${idea.hook ? 'Hook: ' + idea.hook : ''}`;
      await Share.share({ title: idea.title, message: shareText });
    } catch (error) {
      console.error('Error sharing idea:', error);
    }
  };

  const handleDeleteIdea = async () => {
    if (!idea) return;
    try {
      await deleteIdea(idea._id);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to delete idea:', err);
      setError('Failed to delete idea. Please try again.');
    }
  };

  // Toggle the overflow menu
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Render a single refinement card
  const renderRefinementCard = (refinement: IdeaRefinement) => {
    let title = '';
    let content = null;

    switch (refinement.refinementType) {
      case 'titles':
        title = 'Alternative Titles';
        content = (
          <View style={styles.refinementContent}>
            {refinement.result.titles?.map((t: string, index: number) => (
              <View key={index} style={styles.refinementItem}>
                <Text variant="bodyMedium">{index + 1}. {t}</Text>
              </View>
            ))}
          </View>
        );
        break;
      case 'script_outline':
        title = 'Script Outline';
        content = (
          <View style={styles.refinementContent}>
            {refinement.result.outline?.map((section: any, index: number) => (
              <View key={index} style={styles.refinementItem}>
                <Text variant="bodyMedium" style={styles.sectionTitle}>{section.section}</Text>
                <Text variant="bodySmall">{section.description}</Text>
              </View>
            ))}
          </View>
        );
        break;
      case 'elaborate_angle':
        title = 'Elaborated Angle';
        content = (
          <View style={styles.refinementContent}>
            {refinement.result.elaboration?.map((point: string, index: number) => (
              <View key={index} style={styles.refinementItem}>
                <Text variant="bodyMedium">• {point}</Text>
              </View>
            ))}
          </View>
        );
        break;
      case 'hook_ideas':
        title = 'Hook Ideas';
        content = (
          <View style={styles.refinementContent}>
            {refinement.result.hooks?.map((hook: string, index: number) => (
              <View key={index} style={styles.refinementItem}>
                <Text variant="bodyMedium">{index + 1}. {hook}</Text>
              </View>
            ))}
          </View>
        );
        break;
      default:
        title = 'Refinement';
        content = (
          <View style={styles.refinementContent}>
            <Text variant="bodyMedium">Custom refinement</Text>
          </View>
        );
    }
    
    return (
      <Card style={styles.refinementCard} key={refinement._id}>
        <Card.Title
          title={title}
          titleVariant="titleMedium"
          left={(props) => (
            <MaterialCommunityIcons {...props} name="lightbulb-on-outline" size={24} color={theme.colors.primary} />
          )}
        />
        <Card.Content>
          {content}
          <Text variant="bodySmall" style={styles.dateText}>
            Generated on {formatDate(refinement.createdAt)}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading idea details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error || !idea) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error || 'Failed to load idea details'}
          </Text>
          <Button mode="contained" onPress={fetchIdeaDetail} style={styles.retryButton}>
            Retry
          </Button>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>Idea Details</Text>
        <Menu
          visible={menuVisible}
          onDismiss={toggleMenu}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={toggleMenu}
            />
          }
        >
          <Menu.Item 
            leadingIcon="lightbulb-outline" 
            onPress={() => {
              toggleMenu();
              navigateToRefine();
            }}
            title="Refine Idea" 
          />
          <Menu.Item 
            leadingIcon="calendar-plus" 
            onPress={() => {
              toggleMenu();
              scheduleIdea();
            }}
            title="Schedule" 
          />
          <Menu.Item 
            leadingIcon="magnify" 
            onPress={() => {
              toggleMenu();
              navigateToSeo();
            }}
            title="SEO Analysis" 
          />
          <Menu.Item 
            leadingIcon="share-variant" 
            onPress={() => {
              toggleMenu();
              handleShareIdea();
            }}
            title="Share" 
          />
          <Divider />
          <Menu.Item 
            leadingIcon="delete-outline" 
            onPress={() => {
              toggleMenu();
              handleDeleteIdea();
            }}
            title="Delete" 
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.ideaContainer}>
          <Text variant="headlineMedium" style={styles.ideaTitle}>
            {idea.title}
          </Text>
          
          <View style={styles.tagsContainer}>
            {idea.tags.map((tag: string, index: number) => (
              <Chip key={index} style={styles.tagChip} textStyle={styles.tagText}>
                {tag}
              </Chip>
            ))}
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.dateText}>
              Saved on {formatDate(idea.savedAt)}
            </Text>
            {idea.platform_suitability && (
              <Chip 
                style={[
                  styles.suitabilityChip,
                  idea.platform_suitability === 'High'
                    ? styles.highSuitability
                    : idea.platform_suitability === 'Medium'
                      ? styles.mediumSuitability
                      : styles.lowSuitability,
                ]}
                textStyle={styles.suitabilityText}
              >
                {idea.platform_suitability}
              </Chip>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.sectionContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Angle</Text>
            <Text variant="bodyLarge" style={styles.angleText}>{idea.angle}</Text>
          </View>
          
          {idea.hook && (
            <View style={styles.sectionContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Hook</Text>
              <Text variant="bodyMedium" style={styles.hookText}>{idea.hook}</Text>
            </View>
          )}
          
          {idea.structure_points && idea.structure_points.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Structure Points</Text>
              {idea.structure_points.map((point: string, index: number) => (
                <View key={index} style={styles.structurePoint}>
                  <Text variant="bodyMedium">• {point}</Text>
                </View>
              ))}
            </View>
          )}
          
          {idea.intendedEmotion && (
            <View style={styles.sectionContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Intended Emotion</Text>
              <Text variant="bodyMedium" style={styles.emotionText}>{idea.intendedEmotion}</Text>
            </View>
          )}
        </View>
        
        {refinements.length > 0 && (
          <View style={styles.refinementsContainer}>
            <Text variant="titleLarge" style={styles.refinementsTitle}>Refinements</Text>
            {refinements.map((refinement: IdeaRefinement) => renderRefinementCard(refinement))}
          </View>
        )}
        
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: 'bold' },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16 },
  ideaContainer: { marginBottom: 24 },
  ideaTitle: { fontWeight: 'bold', fontSize: 22, marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tagChip: { marginRight: 8, marginBottom: 8 },
  tagText: { fontSize: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateText: { color: '#6B7280' },
  suitabilityChip: { paddingHorizontal: 8, paddingVertical: 2 },
  suitabilityText: { fontSize: 10 },
  highSuitability: { backgroundColor: '#DFF7E5' },
  mediumSuitability: { backgroundColor: '#FFF7DD' },
  lowSuitability: { backgroundColor: '#FFEBEB' },
  divider: { marginVertical: 16 },
  sectionContainer: { marginBottom: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  angleText: { lineHeight: 24 },
  hookText: { fontStyle: 'italic', marginBottom: 8 },
  emotionText: { fontStyle: 'italic', color: '#6B7280', marginBottom: 8 },
  structurePoint: { marginBottom: 8 },
  refinementsContainer: { marginBottom: 24 },
  refinementsTitle: { fontWeight: 'bold', marginBottom: 16 },
  refinementCard: { marginBottom: 16 },
  refinementContent: { marginBottom: 16 },
  refinementItem: { marginBottom: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { marginTop: 12, marginBottom: 24, textAlign: 'center' },
  retryButton: { marginBottom: 12 },
  backButton: { marginTop: 12 },
  footer: { height: 40 },
  // Additional header extras
  headerRightPlaceholder: { width: 24, marginRight: 16 },
  // Styles for IdeaDetailScreen header (if applicable)
  // (If you have any additional styles for the header, define them here)
});

export default IdeaDetailScreen;
