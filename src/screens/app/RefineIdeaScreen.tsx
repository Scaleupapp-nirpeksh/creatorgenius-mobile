// src/screens/app/RefineIdeaScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, Divider, IconButton, RadioButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SavedIdea, refineIdea, updateIdea } from '../../services/ideaService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ParamList = {
  RefineIdea: { idea: SavedIdea };
};

type RefinementOption = {
  value: string;
  label: string;
  description: string;
  icon: string;
};

const REFINEMENT_OPTIONS: RefinementOption[] = [
  {
    value: 'titles',
    label: 'Alternative Titles',
    description: 'Generate 5 alternative catchy titles for your content',
    icon: 'format-title'
  },
  {
    value: 'hook_ideas',
    label: 'Hook Ideas',
    description: 'Create engaging hook ideas to grab audience attention',
    icon: 'lightning-bolt'
  },
  {
    value: 'script_outline',
    label: 'Script Outline',
    description: 'Develop a structured script outline with key sections',
    icon: 'script-text-outline'
  },
  {
    value: 'elaborate_angle',
    label: 'Elaborate Angle',
    description: 'Expand on your idea with more detailed perspectives',
    icon: 'view-array'
  }
];

const RefineIdeaScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'RefineIdea'>>();
  const { idea } = route.params;
  
  // State
  const [selectedOption, setSelectedOption] = useState<string>('titles');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  
  // Handle refinement generation
  const handleGenerateRefinement = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await refineIdea(
        idea._id,
        selectedOption,
        additionalInstructions || undefined
      );
      
      setResult(response.data);
    } catch (err) {
      console.error('Failed to generate refinement:', err);
      setError('Failed to generate refinement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save a refinement to update the original idea
  const saveRefinement = async (value: string) => {
    try {
      setSavingItem(value);
      setError(null);
      
      // Define what to update based on refinement type
      let updateData: Partial<SavedIdea> = {};
      
      switch(selectedOption) {
        case 'titles':
          updateData = { title: value };
          break;
        case 'hook_ideas':
          updateData = { hook: value };
          break;
        case 'elaborate_angle':
          updateData = { angle: value };
          break;
        // For script_outline, we might not want to directly save it to the idea
        case 'script_outline':
          // We could potentially update structure_points here, but the format would need conversion
          setError('Script outlines cannot be directly saved to the idea.');
          setSavingItem(null);
          return;
        default:
          setError('This refinement type does not support direct saving.');
          setSavingItem(null);
          return;
      }
      
      // Call API to update the idea
      await updateIdea(idea._id, updateData);
      
      // Show success message and navigate back
      navigation.goBack();
      
      // After a short delay, navigate to idea detail to refresh with updated data
      setTimeout(() => {
        navigation.navigate('IdeaDetail', { ideaId: idea._id });
      }, 300);
      
    } catch (err) {
      console.error('Failed to save refinement:', err);
      setError('Failed to save selected refinement. Please try again.');
    } finally {
      setSavingItem(null);
    }
  };
  
  // Render result based on refinement type
  const renderRefinementResult = () => {
    if (!result) return null;
    
    let content = null;
    
    switch (selectedOption) {
      case 'titles':
        content = (
          <View style={styles.resultContent}>
            {result.titles?.map((title: string, index: number) => (
              <View key={index} style={styles.resultItem}>
                <Text variant="titleMedium">{index + 1}. {title}</Text>
                <Button 
                  mode="outlined" 
                  onPress={() => saveRefinement(title)}
                  style={styles.saveButton}
                  loading={savingItem === title}
                  disabled={!!savingItem}
                >
                  Use This Title
                </Button>
              </View>
            ))}
          </View>
        );
        break;
      case 'script_outline':
        content = (
          <View style={styles.resultContent}>
            {result.outline?.map((section: any, index: number) => (
              <View key={index} style={styles.resultItem}>
                <Text variant="titleMedium" style={styles.sectionTitle}>{section.section}</Text>
                <Text variant="bodyMedium">{section.description}</Text>
              </View>
            ))}
          </View>
        );
        break;
      case 'elaborate_angle':
        content = (
          <View style={styles.resultContent}>
            {result.elaboration?.map((point: string, index: number) => (
              <View key={index} style={styles.resultItem}>
                <Text variant="titleMedium">• {point}</Text>
                <Button 
                  mode="outlined" 
                  onPress={() => saveRefinement(point)}
                  style={styles.saveButton}
                  loading={savingItem === point}
                  disabled={!!savingItem}
                >
                  Use This Angle
                </Button>
              </View>
            ))}
          </View>
        );
        break;
      case 'hook_ideas':
        content = (
          <View style={styles.resultContent}>
            {result.hooks?.map((hook: string, index: number) => (
              <View key={index} style={styles.resultItem}>
                <Text variant="titleMedium">{index + 1}. {hook}</Text>
                <Button 
                  mode="outlined" 
                  onPress={() => saveRefinement(hook)}
                  style={styles.saveButton}
                  loading={savingItem === hook}
                  disabled={!!savingItem}
                >
                  Use This Hook
                </Button>
              </View>
            ))}
          </View>
        );
        break;
      default:
        content = (
          <View style={styles.resultContent}>
            <Text variant="bodyMedium">Custom refinement result</Text>
          </View>
        );
    }
    
    return (
      <Card style={styles.resultCard}>
        <Card.Title 
          title="Refinement Result" 
          titleVariant="titleLarge"
          right={(props) => (
            <IconButton
              {...props}
              icon="check-circle"
              iconColor={theme.colors.primary}
              size={24}
            />
          )}
        />
        <Card.Content>
          {content}
          
          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={() => {
              // Navigate back to idea detail
              navigation.goBack();
              // After a short delay, navigate to idea detail to refresh refinements
              setTimeout(() => {
                navigation.navigate('IdeaDetail', { ideaId: idea._id });
              }, 300);
            }}
          >
            Done
          </Button>
          <Button 
            mode="outlined"
            onPress={() => {
              setResult(null);
              setAdditionalInstructions('');
              setError(null);
            }}
          >
            Try Another
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>Refine Idea</Text>
        <View style={styles.placeholderIcon} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ideaSummary}>
            <Text variant="titleMedium" style={styles.ideaTitle}>{idea.title}</Text>
            <Text variant="bodySmall" numberOfLines={2} style={styles.ideaAngle}>{idea.angle}</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          {!result && (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>Choose Refinement Type</Text>
              
              <RadioButton.Group onValueChange={value => setSelectedOption(value)} value={selectedOption}>
                {REFINEMENT_OPTIONS.map((option) => (
                  <Card
                    key={option.value}
                    style={[
                      styles.optionCard,
                      selectedOption === option.value && { borderColor: theme.colors.primary, borderWidth: 2 }
                    ]}
                    onPress={() => setSelectedOption(option.value)}
                  >
                    <Card.Content style={styles.optionContent}>
                      <View style={styles.optionLeft}>
                        <MaterialCommunityIcons
                          name={option.icon as any}
                          size={28}
                          color={selectedOption === option.value ? theme.colors.primary : theme.colors.onSurfaceVariant}
                          style={styles.optionIcon}
                        />
                        <View style={styles.optionTextContainer}>
                          <Text variant="titleMedium">{option.label}</Text>
                          <Text variant="bodySmall" style={styles.optionDescription}>{option.description}</Text>
                        </View>
                      </View>
                      <RadioButton value={option.value} />
                    </Card.Content>
                  </Card>
                ))}
              </RadioButton.Group>
              
              <TextInput
                label="Additional Instructions (Optional)"
                value={additionalInstructions}
                onChangeText={setAdditionalInstructions}
                style={styles.textInput}
                multiline
                numberOfLines={3}
                mode="outlined"
              />
              
              <Button
                mode="contained"
                onPress={handleGenerateRefinement}
                style={styles.generateButton}
                disabled={loading}
                loading={loading}
              >
                Generate Refinement
              </Button>
              
              {error && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              )}
            </>
          )}
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Generating refinement...</Text>
            </View>
          )}
          
          {result && renderRefinementResult()}
          
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
  placeholderIcon: {
    width: 24,
    marginRight: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  ideaSummary: {
    marginBottom: 16,
  },
  ideaTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ideaAngle: {
    color: '#6B7280',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionCard: {
    marginBottom: 12,
    elevation: 1,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionDescription: {
    color: '#6B7280',
  },
  textInput: {
    marginTop: 16,
    marginBottom: 24,
  },
  generateButton: {
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  resultCard: {
    marginVertical: 16,
  },
  resultContent: {
    marginVertical: 16,
  },
  resultItem: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  saveButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  footer: {
    height: 40,
  },
});

export default RefineIdeaScreen;