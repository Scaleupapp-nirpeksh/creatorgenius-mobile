// src/screens/app/CreateScriptScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, useTheme, TextInput, HelperText, IconButton, Menu, Divider, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getSavedIdeas, SavedIdea } from '../../services/ideaService';
import { generateScript, saveScript, ScriptGenerationParams } from '../../services/scriptService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CreateScriptScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  
  // State
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null);
  const [ideaMenuVisible, setIdeaMenuVisible] = useState(false);
  const [platformMenuVisible, setPlatformMenuVisible] = useState(false);
  const [styleMenuVisible, setStyleMenuVisible] = useState(false);
  const [durationMenuVisible, setDurationMenuVisible] = useState(false);
  
  const [platform, setPlatform] = useState('youtube');
  const [style, setStyle] = useState<'conversational' | 'educational' | 'storytelling'>('conversational');
  const [targetDuration, setTargetDuration] = useState<'short' | 'medium' | 'long'>('medium');
  const [focusKeywords, setFocusKeywords] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  // Fetch saved ideas
  useEffect(() => {
    fetchIdeas();
  }, []);
  
  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getSavedIdeas();
      const ideasData = response.data || [];
      
      setIdeas(ideasData);
      
      // If there are ideas, select the first one by default
      if (ideasData.length > 0) {
        setSelectedIdea(ideasData[0]);
      }
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
      setError('Failed to load ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!selectedIdea) {
      errors.idea = 'Please select an idea to create a script from';
    }
    
    if (!platform) {
      errors.platform = 'Please select a platform';
    }
    
    setFormErrors(errors);
    
    return Object.keys(errors).length === 0;
  };
  
  // Generate script
  const handleGenerateScript = async () => {
    if (!validateForm() || !selectedIdea) return;
    
    try {
      setGenerating(true);
      setError(null);
      setGeneratedScript(null);
      
      // Prepare keywords array
      const keywordsArray = focusKeywords
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
      
      // Create generation params
      const params: ScriptGenerationParams = {
        platform,
        style,
        targetDuration,
        focusKeywords: keywordsArray,
        additionalInstructions: additionalInstructions || undefined
      };
      
      const response = await generateScript(selectedIdea._id, params);
      setGeneratedScript(response.data);
      
      // Navigate to preview screen
      navigation.navigate('ScriptPreview', { 
        script: response.data,
        ideaId: selectedIdea._id 
      });
    } catch (err) {
      console.error('Failed to generate script:', err);
      setError('Failed to generate script. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  // Platform options
  const platformOptions = [
    { value: 'youtube', label: 'YouTube (Long-form)', icon: 'youtube' },
    { value: 'youtube_short', label: 'YouTube Shorts', icon: 'youtube' },
    { value: 'instagram', label: 'Instagram Post', icon: 'instagram' },
    { value: 'instagram_reel', label: 'Instagram Reel', icon: 'instagram' },
    { value: 'tiktok', label: 'TikTok', icon: 'music-note' },
    { value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { value: 'twitter', label: 'Twitter', icon: 'twitter' },
    { value: 'facebook', label: 'Facebook', icon: 'facebook' }
  ];
  
  // Style options
  const styleOptions = [
    { value: 'conversational', label: 'Conversational', icon: 'chat' },
    { value: 'educational', label: 'Educational', icon: 'school' },
    { value: 'storytelling', label: 'Storytelling', icon: 'book-open-variant' }
  ];
  
  // Duration options
  const durationOptions = [
    { value: 'short', label: 'Short (1-3 minutes)', icon: 'timer-1' },
    { value: 'medium', label: 'Medium (3-7 minutes)', icon: 'timer-3' },
    { value: 'long', label: 'Long (7+ minutes)', icon: 'timer-10' }
  ];
  
  // Handle selected idea
  const handleSelectIdea = (idea: SavedIdea) => {
    setSelectedIdea(idea);
    setIdeaMenuVisible(false);
    
    // Clear idea error if exists
    if (formErrors.idea) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.idea;
        return newErrors;
      });
    }
  };
  
  // Handle selected platform
  const handleSelectPlatform = (value: string) => {
    setPlatform(value);
    setPlatformMenuVisible(false);
    
    // Clear platform error if exists
    if (formErrors.platform) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.platform;
        return newErrors;
      });
    }
  };
  
  // Handle selected style
  const handleSelectStyle = (value: 'conversational' | 'educational' | 'storytelling') => {
    setStyle(value);
    setStyleMenuVisible(false);
  };
  
  // Handle selected duration
  const handleSelectDuration = (value: 'short' | 'medium' | 'long') => {
    setTargetDuration(value);
    setDurationMenuVisible(false);
  };
  
  // Get selected option label
  const getSelectedOptionLabel = (
    options: { value: string; label: string; icon: string }[],
    selectedValue: string
  ): string => {
    const option = options.find(option => option.value === selectedValue);
    return option ? option.label : '';
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>Create Script</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="titleMedium" style={styles.sectionTitle}>Select Content Idea</Text>
          
          {loading ? (
            <ActivityIndicator style={styles.ideaLoading} />
          ) : ideas.length === 0 ? (
            <View style={styles.noIdeasContainer}>
              <Text style={styles.noIdeasText}>No saved ideas found. Create ideas first.</Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('Generate')}
                style={styles.noIdeasButton}
              >
                Create Ideas
              </Button>
            </View>
          ) : (
            <>
              <Menu
                visible={ideaMenuVisible}
                onDismiss={() => setIdeaMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setIdeaMenuVisible(true)}
                    icon="lightbulb-outline"
                    style={styles.selectButton}
                  >
                    {selectedIdea ? selectedIdea.title : 'Select an Idea'}
                  </Button>
                }
              >
                <Menu.Item disabled title="Select an idea:" />
                <Divider />
                {ideas.map(idea => (
                  <Menu.Item
                    key={idea._id}
                    onPress={() => handleSelectIdea(idea)}
                    title={idea.title}
                  />
                ))}
              </Menu>
              
              {formErrors.idea && (
                <HelperText type="error" visible={!!formErrors.idea}>
                  {formErrors.idea}
                </HelperText>
              )}
              
              {selectedIdea && (
                <View style={styles.selectedIdeaPreview}>
                  <Text variant="bodySmall">{selectedIdea.angle}</Text>
                  <View style={styles.tagsContainer}>
                    {selectedIdea.tags.slice(0, 3).map((tag, index) => (
                      <Chip key={index} style={styles.tagChip} textStyle={styles.tagText}>
                        {tag}
                      </Chip>
                    ))}
                    {selectedIdea.tags.length > 3 && (
                      <Text variant="bodySmall" style={styles.moreTags}>
                        +{selectedIdea.tags.length - 3} more
                      </Text>
                    )}
                  </View>
                </View>
              )}
              
              <Text variant="titleMedium" style={styles.sectionTitle}>Script Settings</Text>
              
              <Text variant="bodySmall" style={styles.fieldLabel}>Platform</Text>
              <Menu
                visible={platformMenuVisible}
                onDismiss={() => setPlatformMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setPlatformMenuVisible(true)}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={platformOptions.find(option => option.value === platform)?.icon || 'help-circle'}
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                    style={styles.selectButton}
                  >
                    {getSelectedOptionLabel(platformOptions, platform)}
                  </Button>
                }
              >
                {platformOptions.map(option => (
                  <Menu.Item
                    key={option.value}
                    onPress={() => handleSelectPlatform(option.value)}
                    title={option.label}
                    leadingIcon={() => (
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={20}
                        color={theme.colors.onSurface}
                      />
                    )}
                  />
                ))}
              </Menu>
              
              {formErrors.platform && (
                <HelperText type="error" visible={!!formErrors.platform}>
                  {formErrors.platform}
                </HelperText>
              )}
              
              <Text variant="bodySmall" style={styles.fieldLabel}>Style</Text>
              <Menu
                visible={styleMenuVisible}
                onDismiss={() => setStyleMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setStyleMenuVisible(true)}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={styleOptions.find(option => option.value === style)?.icon || 'help-circle'}
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                    style={styles.selectButton}
                  >
                    {getSelectedOptionLabel(styleOptions, style)}
                  </Button>
                }
              >
                {styleOptions.map(option => (
                  <Menu.Item
                    key={option.value}
                    onPress={() => handleSelectStyle(option.value as any)}
                    title={option.label}
                    leadingIcon={() => (
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={20}
                        color={theme.colors.onSurface}
                      />
                    )}
                  />
                ))}
              </Menu>
              
              <Text variant="bodySmall" style={styles.fieldLabel}>Target Duration</Text>
              <Menu
                visible={durationMenuVisible}
                onDismiss={() => setDurationMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setDurationMenuVisible(true)}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={durationOptions.find(option => option.value === targetDuration)?.icon || 'help-circle'}
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                    style={styles.selectButton}
                  >
                    {getSelectedOptionLabel(durationOptions, targetDuration)}
                  </Button>
                }
              >
                {durationOptions.map(option => (
                  <Menu.Item
                    key={option.value}
                    onPress={() => handleSelectDuration(option.value as any)}
                    title={option.label}
                    leadingIcon={() => (
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={20}
                        color={theme.colors.onSurface}
                      />
                    )}
                  />
                ))}
              </Menu>
              
              <Text variant="bodySmall" style={styles.fieldLabel}>Focus Keywords (Optional)</Text>
              <TextInput
                mode="outlined"
                value={focusKeywords}
                onChangeText={setFocusKeywords}
                placeholder="Separate keywords with commas"
                style={styles.textInput}
              />
              <Text variant="bodySmall" style={styles.fieldHint}>
                Specific keywords you want to emphasize in the script
              </Text>
              
              <Text variant="bodySmall" style={styles.fieldLabel}>Additional Instructions (Optional)</Text>
              <TextInput
                mode="outlined"
                value={additionalInstructions}
                onChangeText={setAdditionalInstructions}
                placeholder="Any specific instructions for the script"
                multiline
                numberOfLines={3}
                style={styles.textInput}
              />
              <Text variant="bodySmall" style={styles.fieldHint}>
                Special instructions, tone preferences, or formatting requirements
              </Text>
              
              {error && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              )}
              
              <Button
                mode="contained"
                onPress={handleGenerateScript}
                style={styles.generateButton}
                icon="script-text-outline"
                loading={generating}
                disabled={generating || loading || ideas.length === 0}
              >
                {generating ? 'Generating Script...' : 'Generate Script'}
              </Button>
            </>
          )}
          
          <View style={styles.footer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  ideaLoading: {
    marginVertical: 20,
  },
  noIdeasContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  noIdeasText: {
    marginBottom: 12,
  },
  noIdeasButton: {
    marginTop: 8,
  },
  selectButton: {
    width: '100%',
    marginBottom: 8,
  },
  selectedIdeaPreview: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
  },
  moreTags: {
    color: '#6B7280',
    alignSelf: 'center',
  },
  fieldLabel: {
    marginBottom: 4,
    fontWeight: 'bold',
  },
  textInput: {
    marginBottom: 4,
  },
  fieldHint: {
    color: '#6B7280',
    marginBottom: 16,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  generateButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  footer: {
    height: 40,
  },
});

export default CreateScriptScreen;