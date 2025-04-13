// src/screens/app/SeoAnalysisScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
  Chip,
  Divider,
  IconButton,
  Menu,
  Portal,
  Dialog,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { analyzeContentSeoApi, saveSeoReportAsInsightApi, SeoAnalysisResult } from '../../services/apiClient';

// Define the route parameters type for this screen
type SeoAnalysisRouteProp = RouteProp<
  {
    SeoAnalysis: {
      prefillData?: {
        topic?: string;
        currentTitle?: string;
        currentDescription?: string;
        keywords?: string;
        contentText?: string;
        platform?: string;
      };
      ideaId?: string;
      scriptId?: string;
    };
  },
  'SeoAnalysis'
>;

const PlatformOptions = [
  { value: 'youtube_long', label: 'YouTube (Long-form)', icon: 'youtube' },
  { value: 'youtube_short', label: 'YouTube Shorts', icon: 'youtube' },
  { value: 'instagram_post', label: 'Instagram Post', icon: 'instagram' },
  { value: 'instagram_reel', label: 'Instagram Reel', icon: 'instagram' },
  { value: 'tiktok', label: 'TikTok', icon: 'music-note' },
  { value: 'blog_post', label: 'Blog Post', icon: 'post' },
  { value: 'linkedin_post', label: 'LinkedIn Post', icon: 'linkedin' },
];

const SeoAnalysisScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<SeoAnalysisRouteProp>();

  // Extract potential prefill data and other params from route
  const prefillData = route.params?.prefillData;
  const ideaId = route.params?.ideaId;
  const scriptId = route.params?.scriptId;

  // Form state
  const [platform, setPlatform] = useState('');
  const [platformMenuVisible, setPlatformMenuVisible] = useState(false);
  const [topic, setTopic] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [contentText, setContentText] = useState('');
  const [language, setLanguage] = useState('en');

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [seoResult, setSeoResult] = useState<SeoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Save dialog state
  const [saveDialogVisible, setSaveDialogVisible] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // On component mount, if prefillData exists, set form state accordingly
  useEffect(() => {
    if (prefillData) {
      if (prefillData.topic) setTopic(prefillData.topic);
      if (prefillData.currentTitle) setCurrentTitle(prefillData.currentTitle);
      if (prefillData.currentDescription) setCurrentDescription(prefillData.currentDescription);
      if (prefillData.keywords) setKeywords(prefillData.keywords);
      if (prefillData.contentText) setContentText(prefillData.contentText);
      if (prefillData.platform) setPlatform(prefillData.platform);
    }
  }, [prefillData]);

  // Analyze SEO
  const handleAnalyzeSeo = async () => {
    if (!platform) {
      setError('Please select a platform');
      return;
    }

    if (!topic && !currentTitle && !keywords) {
      setError('Please provide at least a topic, title, or keywords for analysis');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setSeoResult(null);

      const keywordsArray = keywords
        ? keywords.split(',').map(k => k.trim()).filter(Boolean)
        : [];

      const seoData = {
        targetPlatform: platform,
        language,
        topic: topic || undefined,
        currentTitle: currentTitle || undefined,
        currentDescription: currentDescription || undefined,
        keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
        contentText: contentText || undefined,
      };

      const response = await analyzeContentSeoApi(seoData);

      if (response.success && response.data) {
        setSeoResult(response.data);
        // Pre-populate save title if provided by API
        if (response.data.suggestedSaveTitle) {
          setSaveTitle(response.data.suggestedSaveTitle);
        } else {
          setSaveTitle(`SEO Analysis for ${topic || currentTitle || 'Content'}`);
        }
      } else {
        setError(response.message || 'Failed to analyze SEO. Please try again.');
      }
    } catch (err: any) {
      console.error('Error analyzing SEO:', err);
      setError(err.message || 'An error occurred during SEO analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  // Save SEO report as insight
  const handleSaveSeoReport = async () => {
    if (!seoResult) return;

    try {
      setSaving(true);

      const saveData = {
        title: saveTitle || `SEO Analysis for ${topic || currentTitle || 'Content'}`,
        seoData: seoResult,
        sourceQuery: topic || currentTitle || keywords,
        notes: saveNotes || undefined
      };

      const response = await saveSeoReportAsInsightApi(saveData);

      if (response.success) {
        setSaveDialogVisible(false);
        setSnackbarMessage('SEO report saved successfully!');
        setSnackbarVisible(true);
      } else {
        throw new Error(response.message || 'Failed to save SEO report');
      }
    } catch (err: any) {
      console.error('Error saving SEO report:', err);
      setSnackbarMessage(err.message || 'Failed to save SEO report');
      setSnackbarVisible(true);
    } finally {
      setSaving(false);
    }
  };

  // New: Handle new analysis – clear current results and form fields
  const handleNewAnalysis = () => {
    setSeoResult(null);
    setError(null);
    setPlatform('');
    setTopic('');
    setCurrentTitle('');
    setCurrentDescription('');
    setKeywords('');
    setContentText('');
  };

  // Get platform icon
  const getPlatformIcon = (value: string): string => {
    const option = PlatformOptions.find(opt => opt.value === value);
    return option?.icon || 'help-circle';
  };

  // Get platform label
  const getPlatformLabel = (value: string): string => {
    const option = PlatformOptions.find(opt => opt.value === value);
    return option?.label || value;
  };

  // Render the SEO analysis results
  const renderSeoResults = () => {
    if (!seoResult) return null;

    return (
      <Card style={styles.resultsCard}>
        <Card.Title
          title="SEO Analysis Results"
          subtitle={`Platform: ${getPlatformLabel(platform)}`}
          left={props => (
            <MaterialCommunityIcons
              {...props}
              name="search-web"
              size={32}
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <IconButton icon="content-save" size={24} onPress={() => setSaveDialogVisible(true)} />
          )}
        />
        <Card.Content>
          {/* Optimized Titles */}
          {seoResult.optimizedTitles && seoResult.optimizedTitles.length > 0 && (
            <View style={styles.resultSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Suggested Titles
              </Text>
              {seoResult.optimizedTitles.map((title, index: number) => (
                <Card key={index} style={styles.suggestionCard}>
                  <Card.Content>
                    <Text variant="bodyLarge">{title}</Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}

          {/* Keywords */}
          {seoResult.suggestedKeywords && seoResult.suggestedKeywords.length > 0 && (
            <View style={styles.resultSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Suggested Keywords
              </Text>
              <View style={styles.keywordsContainer}>
                {seoResult.suggestedKeywords.map((keyword: string, index: number) => (
                  <Chip key={index} style={styles.keywordChip}>
                    {keyword}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {seoResult.optimizedDescription && (
            <View style={styles.resultSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Optimized Description
              </Text>
              <Card style={styles.suggestionCard}>
                <Card.Content>
                  <Text variant="bodyMedium">{seoResult.optimizedDescription}</Text>
                </Card.Content>
              </Card>
            </View>
          )}

          {/* Hashtags */}
          {seoResult.suggestedHashtags && seoResult.suggestedHashtags.length > 0 && (
            <View style={styles.resultSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Suggested Hashtags
              </Text>
              <View style={styles.keywordsContainer}>
                {seoResult.suggestedHashtags.map((hashtag: string, index: number) => (
                  <Chip key={index} style={styles.hashtagChip}>
                    #{hashtag}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* Feedback */}
          {seoResult.contentFeedback && (
            <View style={styles.resultSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Content Feedback
              </Text>
              <Card style={[styles.suggestionCard, { backgroundColor: theme.colors.primaryContainer }]}>
                <Card.Content>
                  <Text variant="bodyMedium">{seoResult.contentFeedback}</Text>
                </Card.Content>
              </Card>
            </View>
          )}

          <Button
            mode="contained"
            onPress={() => setSaveDialogVisible(true)}
            style={styles.saveButton}
            icon="content-save"
          >
            Save as Insight
          </Button>
          <Button
            mode="outlined"
            onPress={handleNewAnalysis}
            style={styles.newAnalysisButton}
            icon="plus"
          >
            New Analysis
          </Button>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={styles.headerTitle}>SEO Analysis</Text>
        {/* Plus button is added in the header so it's always visible */}
        <IconButton icon="plus" size={24} onPress={handleNewAnalysis} />
        <IconButton icon="bookmark-multiple" size={24} onPress={() => navigation.navigate('SavedSeoInsights')} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {!seoResult ? (
            <Card style={styles.formCard}>
              <Card.Title title="SEO Analysis Settings" />
              <Card.Content>
                <Text variant="bodyMedium" style={styles.instructionText}>
                  Optimize your content for search and discovery by analyzing SEO elements like keywords, titles, and descriptions.
                </Text>

                {/* Platform Selection */}
                <Text variant="titleSmall" style={styles.inputLabel}>Platform *</Text>
                <Menu
                  visible={platformMenuVisible}
                  onDismiss={() => setPlatformMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setPlatformMenuVisible(true)}
                      icon={platform ? getPlatformIcon(platform) : 'devices'}
                      style={styles.selectButton}
                    >
                      {platform ? getPlatformLabel(platform) : 'Select Platform'}
                    </Button>
                  }
                >
                  {PlatformOptions.map(option => (
                    <Menu.Item
                      key={option.value}
                      onPress={() => {
                        setPlatform(option.value);
                        setPlatformMenuVisible(false);
                      }}
                      title={option.label}
                      leadingIcon={option.icon}
                    />
                  ))}
                </Menu>

                {/* Topic Input */}
                <Text variant="titleSmall" style={styles.inputLabel}>Content Topic</Text>
                <TextInput
                  mode="outlined"
                  value={topic}
                  onChangeText={setTopic}
                  placeholder="e.g., Smartphone Photography Tips"
                  style={styles.textInput}
                />

                {/* Current Title */}
                <Text variant="titleSmall" style={styles.inputLabel}>Current Title</Text>
                <TextInput
                  mode="outlined"
                  value={currentTitle}
                  onChangeText={setCurrentTitle}
                  placeholder="e.g., How to Take Better Photos with Your Phone"
                  style={styles.textInput}
                />

                {/* Keywords */}
                <Text variant="titleSmall" style={styles.inputLabel}>Keywords</Text>
                <TextInput
                  mode="outlined"
                  value={keywords}
                  onChangeText={setKeywords}
                  placeholder="Separate keywords with commas"
                  style={styles.textInput}
                />

                {/* Content Description */}
                <Text variant="titleSmall" style={styles.inputLabel}>Current Description</Text>
                <TextInput
                  mode="outlined"
                  value={currentDescription}
                  onChangeText={setCurrentDescription}
                  placeholder="Enter your current description or summary"
                  multiline
                  numberOfLines={3}
                  style={styles.textInput}
                />

                {/* Content Text */}
                <Text variant="titleSmall" style={styles.inputLabel}>Content Text (Optional)</Text>
                <TextInput
                  mode="outlined"
                  value={contentText}
                  onChangeText={setContentText}
                  placeholder="Enter the full content or script for deeper analysis"
                  multiline
                  numberOfLines={5}
                  style={styles.textInput}
                />

                {/* Language */}
                <Text variant="titleSmall" style={styles.inputLabel}>Language</Text>
                <TextInput
                  mode="outlined"
                  value={language}
                  onChangeText={setLanguage}
                  placeholder="e.g., en, hi, es"
                  style={styles.textInput}
                />

                {error && (
                  <HelperText type="error" visible={!!error}>
                    {error}
                  </HelperText>
                )}

                <Button
                  mode="contained"
                  onPress={handleAnalyzeSeo}
                  loading={analyzing}
                  disabled={analyzing}
                  style={styles.analyzeButton}
                  icon="magnify"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze SEO'}
                </Button>
              </Card.Content>
            </Card>
          ) : (
            renderSeoResults()
          )}

          {analyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Analyzing SEO factors...</Text>
            </View>
          )}

          <View style={styles.footer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Dialog */}
      <Portal>
        <Dialog visible={saveDialogVisible} onDismiss={() => setSaveDialogVisible(false)}>
          <Dialog.Title>Save SEO Report</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title"
              value={saveTitle}
              onChangeText={setSaveTitle}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Notes (Optional)"
              value={saveNotes}
              onChangeText={setSaveNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSaveDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveSeoReport} loading={saving} disabled={saving}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: 'bold' },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16 },
  formCard: { marginBottom: 16 },
  instructionText: { marginBottom: 16, color: '#6B7280' },
  inputLabel: { marginTop: 12, marginBottom: 4 },
  selectButton: { marginBottom: 12, width: '100%' },
  textInput: { marginBottom: 12 },
  analyzeButton: { marginTop: 16 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6B7280' },
  resultsCard: { marginBottom: 16 },
  resultSection: { marginBottom: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  suggestionCard: { marginBottom: 8 },
  keywordsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  keywordChip: { margin: 4 },
  hashtagChip: { margin: 4, backgroundColor: '#E0F7FA' },
  saveButton: { marginTop: 16 },
  newAnalysisButton: { marginTop: 12 },
  dialogInput: { marginBottom: 16 },
  footer: { height: 40 },
});

export default SeoAnalysisScreen;
