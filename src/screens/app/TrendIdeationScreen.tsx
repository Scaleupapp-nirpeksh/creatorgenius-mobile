// src/screens/app/TrendIdeationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Keyboard,
  Alert
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  useTheme,
  ActivityIndicator,
  Card,
  Chip,
  Divider,
  IconButton,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { generateTrendIdeasApi } from '../../services/apiClient';
import { saveIdea } from '../../services/ideaService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define route params type
type ParamList = {
  TrendIdeation: {
    trend: {
      _id: string;
      title: string;
      content: any;
      source?: {
        query?: string;
      };
    };
  };
};

const TrendIdeationScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'TrendIdeation'>>();
  const { trend } = route.params;

  // Form state
  const [trendDescription, setTrendDescription] = useState('');
  const [platform, setPlatform] = useState('');
  const [language, setLanguage] = useState('');
  const [numberOfIdeas, setNumberOfIdeas] = useState('3');

  // UI state
  const [loading, setLoading] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [savingIdeaId, setSavingIdeaId] = useState<string | null>(null);
  const [savedIdeaTitles, setSavedIdeaTitles] = useState<string[]>([]);

  // Initialize trend description from the passed trend
  useEffect(() => {
    if (trend) {
      // Use the original search query if available, otherwise use the title
      const description = trend.source?.query || trend.title;
      setTrendDescription(description);
      
      // Optional: Extract trend summary if available
      if (trend.content?.summary) {
        setTrendDescription(prev => 
          `${prev}\n\nSummary: ${trend.content.summary}`
        );
      }
    }
  }, [trend]);

  const handleGenerateIdeas = async () => {
    if (!trendDescription.trim()) {
      setError('Please provide a trend description.');
      return;
    }
    
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setGeneratedIdeas([]);
    
    try {
      const payload = {
        trendDescription: trendDescription.trim(),
        platform: platform || undefined,
        language: language || undefined,
        numberOfIdeas: Number(numberOfIdeas) || 3,
      };
      
      const response = await generateTrendIdeasApi(payload);
      
      if (response.success) {
        setGeneratedIdeas(response.data || []);
      } else {
        setError(response.message || 'Failed to generate ideas from this trend.');
      }
    } catch (err: any) {
      console.error('Error generating trend ideas:', err);
      setError(err.message || 'Failed to generate ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to save an idea
  const handleSaveIdea = async (idea: any) => {
    try {
      setSavingIdeaId(idea.title); // Using title as a temporary indicator
      
      const payload = {
        title: idea.title,
        angle: idea.angle,
        tags: idea.tags,
        hook: idea.hook,
        structure_points: idea.structure_points,
        platform_suitability: idea.platform_suitability,
        intendedEmotion: idea.intendedEmotion
      };
      
      const response = await saveIdea(payload);
      
      if (response.success) {
        setSnackbarMessage('Idea saved successfully!');
        // Mark this idea as saved by its title
        setSavedIdeaTitles(prev => [...prev, idea.title]);
      } else {
        setSnackbarMessage('Failed to save idea.');
      }
    } catch (error: any) {
      console.error('Error saving idea:', error);
      setSnackbarMessage(error.message || 'Error saving idea.');
    } finally {
      setSavingIdeaId(null);
      setSnackbarVisible(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>Generate from Trend</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.trendCard}>
          <Card.Title title="Trend Source" />
          <Card.Content>
            <Text style={styles.trendTitle}>{trend.title}</Text>
            {trend.content?.summary && (
              <Text style={styles.trendSummary}>{trend.content.summary}</Text>
            )}
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>Trend Description</Text>
        <TextInput
          mode="outlined"
          label="Describe the trend"
          value={trendDescription}
          onChangeText={setTrendDescription}
          multiline
          numberOfLines={4}
          style={styles.input}
        />
        <Text variant="bodySmall" style={styles.inputHelper}>
          Provide details about the trend to generate relevant content ideas
        </Text>

        <Text variant="titleMedium" style={styles.sectionTitle}>Options</Text>
        <TextInput
          mode="outlined"
          label="Platform (optional)"
          placeholder="e.g., YouTube, Instagram"
          value={platform}
          onChangeText={setPlatform}
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="Language (optional)"
          placeholder="e.g., English, Hindi"
          value={language}
          onChangeText={setLanguage}
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="Number of Ideas"
          value={numberOfIdeas}
          onChangeText={setNumberOfIdeas}
          keyboardType="numeric"
          style={styles.input}
        />

        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleGenerateIdeas}
          style={styles.generateButton}
          loading={loading}
          disabled={loading || !trendDescription.trim()}
          icon="trending-up"
        >
          {loading ? 'Generating...' : 'Generate Ideas from Trend'}
        </Button>

        {generatedIdeas.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text variant="titleLarge" style={styles.resultsHeader}>
              Generated Ideas
            </Text>
            {generatedIdeas.map((idea, index) => {
              const isSaved = savedIdeaTitles.includes(idea.title);
              return (
                <Card key={index} style={styles.ideaCard}>
                  <View style={styles.ideaHeader}>
                    <Text variant="titleMedium" style={styles.ideaTitle} numberOfLines={2}>
                      {idea.title}
                    </Text>
                    <Divider style={styles.headerDivider} />
                  </View>
                  <Card.Content>
                    <Text variant="bodyMedium" style={styles.ideaAngle}>
                      {idea.angle}
                    </Text>
                    {idea.hook && (
                      <Text variant="bodySmall" style={styles.ideaDetail}>
                        <Text style={styles.detailLabel}>Hook: </Text>
                        {idea.hook}
                      </Text>
                    )}
                    {idea.structure_points && Array.isArray(idea.structure_points) && (
                      <View style={styles.structureContainer}>
                        <Text style={[styles.detailLabel, styles.structureHeader]}>Structure Points:</Text>
                        {idea.structure_points.map((point: string, idx: number) => (
                          <Text key={idx} style={styles.structurePoint}>
                            • {point}
                          </Text>
                        ))}
                      </View>
                    )}
                    {idea.tags && Array.isArray(idea.tags) && (
                      <View style={styles.tagContainer}>
                        {idea.tags.map((tag: string, idx: number) => (
                          <Chip key={idx} style={styles.chip} textStyle={styles.chipText}>
                            #{tag}
                          </Chip>
                        ))}
                      </View>
                    )}
                    {idea.platform_suitability && (
                      <Text variant="bodySmall" style={styles.ideaDetail}>
                        <Text style={styles.detailLabel}>Platform Suitability: </Text>
                        {idea.platform_suitability}
                      </Text>
                    )}
                    {idea.intendedEmotion && (
                      <Text variant="bodySmall" style={styles.ideaDetail}>
                        <Text style={styles.detailLabel}>Emotion: </Text>
                        {idea.intendedEmotion}
                      </Text>
                    )}
                  </Card.Content>
                  <Card.Actions>
                    <Button
                      mode="contained"
                      icon={isSaved ? "check" : "content-save"}
                      onPress={() => !isSaved && handleSaveIdea(idea)}
                      disabled={isSaved || savingIdeaId === idea.title}
                      loading={savingIdeaId === idea.title}
                      style={[
                        styles.saveButton,
                        isSaved && { backgroundColor: '#9E9E9E' } // Gray when saved
                      ]}
                    >
                      {isSaved ? "Saved" : "Save Idea"}
                    </Button>
                  </Card.Actions>
                </Card>
              );
            })}
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
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
  headerRightPlaceholder: {
    width: 24,
    marginRight: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  trendCard: {
    marginBottom: 16,
  },
  trendTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trendSummary: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  inputHelper: {
    marginBottom: 16,
    marginTop: -4,
    paddingHorizontal: 4,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  generateButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsHeader: {
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  ideaCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 3,
  },
  ideaHeader: {
    flexDirection: 'column',
    padding: 12,
  },
  ideaTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  headerDivider: {
    marginTop: 4,
  },
  ideaAngle: {
    marginBottom: 8,
    lineHeight: 20,
  },
  ideaDetail: { 
    marginBottom: 4 
  },
  detailLabel: { 
    fontWeight: 'bold' 
  },
  structureContainer: { 
    marginBottom: 8 
  },
  structureHeader: { 
    marginBottom: 4 
  },
  structurePoint: { 
    marginLeft: 8, 
    lineHeight: 18 
  },
  tagContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginTop: 8 
  },
  chip: { 
    marginRight: 6, 
    marginBottom: 6, 
    backgroundColor: '#E0F7FA' 
  },
  chipText: { 
    color: '#00796B' 
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#FF9800', // Orange color
  },
  footer: {
    height: 40,
  },
});

export default TrendIdeationScreen;