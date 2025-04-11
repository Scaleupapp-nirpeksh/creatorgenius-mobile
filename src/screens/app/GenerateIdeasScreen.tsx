// src/screens/app/GenerateIdeasScreen.tsx
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  useTheme,
  ActivityIndicator,
  HelperText,
  Card,
  Chip,
  Divider,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateContentIdeas } from '../../services/contentService';
import { saveIdea } from '../../services/ideaService';

const GenerateIdeasScreen = () => {
  const theme = useTheme();

  // Form state
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [platform, setPlatform] = useState('');
  const [language, setLanguage] = useState('');
  const [niche, setNiche] = useState('General Indian Audience');
  const [tone, setTone] = useState('Engaging and Informative');
  const [audienceDetails, setAudienceDetails] = useState('');
  const [numberOfIdeas, setNumberOfIdeas] = useState('5');

  // UI state
  const [loading, setLoading] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [savingIdeaId, setSavingIdeaId] = useState<string | null>(null);
  // Track saved idea titles to update button state
  const [savedIdeaTitles, setSavedIdeaTitles] = useState<string[]>([]);

  const handleGenerateIdeas = async () => {
    if (!topic && !keywords) {
      setError('Please provide at least a topic or some keywords.');
      return;
    }
    setError(null);
    setLoading(true);
    setGeneratedIdeas([]);
    try {
      const payload = {
        topic,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        platform,
        language,
        niche,
        tone,
        targetAudienceDetails: audienceDetails,
        numberOfIdeas: Number(numberOfIdeas) || 5,
      };
      const response = await generateContentIdeas(payload);
      if (response.success) {
        setGeneratedIdeas(response.data);
      } else {
        setError(response.message || 'Failed to generate ideas.');
      }
    } catch (err: any) {
      console.error('Error generating ideas:', err);
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.headerText}>
            Generate Content Ideas
          </Text>
          {error && <HelperText type="error">{error}</HelperText>}
          <TextInput
            mode="outlined"
            label="Topic"
            placeholder="Enter a topic (optional)"
            value={topic}
            onChangeText={setTopic}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Keywords"
            placeholder="Enter keywords separated by commas"
            value={keywords}
            onChangeText={setKeywords}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Platform"
            placeholder="e.g., YouTube, Instagram"
            value={platform}
            onChangeText={setPlatform}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Language"
            placeholder="e.g., English"
            value={language}
            onChangeText={setLanguage}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Niche"
            placeholder="e.g., General Indian Audience"
            value={niche}
            onChangeText={setNiche}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Tone"
            placeholder="e.g., Engaging and Informative"
            value={tone}
            onChangeText={setTone}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Audience Details"
            placeholder="Details about your target audience"
            value={audienceDetails}
            onChangeText={setAudienceDetails}
            style={styles.input}
            multiline
          />
          <TextInput
            mode="outlined"
            label="Number of Ideas"
            placeholder="Enter a number between 1 and 10"
            value={numberOfIdeas}
            onChangeText={setNumberOfIdeas}
            style={styles.input}
            keyboardType="numeric"
          />
          <Button
            mode="contained"
            icon="lightbulb-on-outline"
            onPress={handleGenerateIdeas}
            style={styles.generateButton}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Ideas"}
          </Button>
          {loading && <ActivityIndicator style={styles.loading} color={theme.colors.primary} />}
          {generatedIdeas.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text variant="titleMedium" style={styles.resultsHeader}>
                Generated Ideas
              </Text>
              {generatedIdeas.map((idea, index) => {
                const isSaved = savedIdeaTitles.includes(idea.title);
                return (
                  <Card key={index} style={[styles.ideaCard, { backgroundColor: theme.colors.surface }]}>
                    {/* Custom header for idea title */}
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
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: theme.colors.secondary }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  headerText: {
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
  },
  input: { marginBottom: 12 },
  generateButton: { marginTop: 16, marginBottom: 16 },
  loading: { marginVertical: 16 },
  resultsContainer: { marginTop: 20 },
  resultsHeader: { marginBottom: 12, fontWeight: 'bold', textAlign: 'center' },
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
  ideaDetail: { marginBottom: 4 },
  detailLabel: { fontWeight: 'bold' },
  structureContainer: { marginBottom: 8 },
  structureHeader: { marginBottom: 4 },
  structurePoint: { marginLeft: 8, lineHeight: 18 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  chip: { marginRight: 6, marginBottom: 6, backgroundColor: '#E0F7FA' },
  chipText: { color: '#00796B' },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#FF9800', // Orange color
  },
});

export default GenerateIdeasScreen;
