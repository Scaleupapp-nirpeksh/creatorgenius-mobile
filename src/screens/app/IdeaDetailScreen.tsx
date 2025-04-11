// src/screens/app/IdeaDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
  
  // Fetch idea details
  useEffect(() => {
    fetchIdeaDetail();
  }, [ideaId]);
  
  // Fetch idea detail and refinements
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
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  // Navigate to refinement screen
  const navigateToRefine = () => {
    if (idea) {
      navigation.navigate('RefineIdea', { idea });
    }
  };
  
  // Schedule the idea
  const scheduleIdea = () => {
    if (idea) {
      navigation.navigate('Calendar', { 
        screen: 'AddSchedule', 
        params: { ideaId: idea._id, ideaTitle: idea.title } 
      });
    }
  };
  
  // Delete the idea
  const handleDeleteIdea = async () => {
    if (!idea) return;
    
    try {
      await deleteIdea(idea._id);
      // Navigate back after deletion
      navigation.goBack();
    } catch (err) {
      console.error('Failed to delete idea:', err);
      setError('Failed to delete idea. Please try again.');
    }
  };
  
  // Toggle menu
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };
  
  // Render refinement card
  const renderRefinementCard = (refinement: IdeaRefinement) => {
    let title = '';
    let content = null;
    
    switch (refinement.refinementType) {
      case 'titles':
        title = 'Alternative Titles';
        content = (
          <View style={styles.refinementContent}>
            {refinement.result.titles?.map((title: string, index: number) => (
              <View key={index} style={styles.refinementItem}>
                <Text variant="bodyMedium">{index + 1}. {title}</Text>
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
          left={(props) => <MaterialCommunityIcons {...props} name="lightbulb-on-outline" size={24} color={theme.colors.primary} />}
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
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
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
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ideaContainer}>
          <Text variant="headlineMedium" style={styles.ideaTitle}>{idea.title}</Text>
          
          <View style={styles.tagsContainer}>
            {idea.tags.map((tag, index) => (
              <Chip 
                key={index} 
                style={styles.tag}
                textStyle={styles.tagText}
              >
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
                      : styles.lowSuitability
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
              {idea.structure_points.map((point, index) => (
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
        
        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            onPress={scheduleIdea}
            icon="calendar-plus"
            style={styles.actionButton}
          >
            Schedule
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={navigateToRefine}
            icon="lightbulb-on-outline"
            style={styles.actionButton}
          >
            Refine
          </Button>
        </View>
      </View>
      
      {refinements.length > 0 && (
        <View style={styles.refinementsContainer}>
          <Text variant="titleLarge" style={styles.refinementsTitle}>Refinements</Text>
          {refinements.map(refinement => renderRefinementCard(refinement))}
        </View>
      )}
      
      <View style={styles.footer} />
    </ScrollView>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
},
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
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
scrollContainer: {
  flex: 1,
},
scrollContent: {
  padding: 16,
},
ideaContainer: {
  marginBottom: 24,
},
ideaTitle: {
  fontWeight: 'bold',
  marginBottom: 12,
},
tagsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginBottom: 16,
},
tag: {
  marginRight: 8,
  marginBottom: 8,
},
tagText: {
  fontSize: 12,
},
infoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
dateText: {
  color: '#6B7280',
},
suitabilityChip: {
  height: 24,
},
suitabilityText: {
  fontSize: 10,
},
highSuitability: {
  backgroundColor: '#DFF7E9', // Light green
},
mediumSuitability: {
  backgroundColor: '#FFF7DD', // Light yellow
},
lowSuitability: {
  backgroundColor: '#FFEBEB', // Light red
},
divider: {
  marginVertical: 16,
},
sectionContainer: {
  marginBottom: 20,
},
sectionTitle: {
  fontWeight: 'bold',
  marginBottom: 8,
},
angleText: {
  lineHeight: 24,
},
hookText: {
  fontStyle: 'italic',
},
emotionText: {
  // Add any specific styling for emotion text
},
structurePoint: {
  marginBottom: 8,
},
actionsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginTop: 24,
  marginBottom: 8,
},
actionButton: {
  flex: 1,
  marginHorizontal: 8,
},
refinementsContainer: {
  marginBottom: 24,
},
refinementsTitle: {
  fontWeight: 'bold',
  marginBottom: 16,
},
refinementCard: {
  marginBottom: 16,
},
refinementContent: {
  marginBottom: 16,
},
refinementItem: {
  marginBottom: 12,
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
errorContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 24,
},
errorText: {
  marginTop: 12,
  marginBottom: 24,
  textAlign: 'center',
},
retryButton: {
  marginBottom: 12,
},
backButton: {
  marginTop: 12,
},
footer: {
  height: 40,
},
});

export default IdeaDetailScreen;