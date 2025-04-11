// src/screens/app/ScriptPreviewScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, useTheme, Card, Chip, TextInput, ActivityIndicator, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { saveScript, Script, ScriptSection } from '../../services/scriptService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ParamList = {
  ScriptPreview: { 
    script: Script;
    ideaId: string;
  };
};

const ScriptPreviewScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'ScriptPreview'>>();
  
  // Extract script and ideaId from route params
  const { script: initialScript, ideaId } = route.params;
  
  // State for editable title
  const [title, setTitle] = useState(initialScript.title);
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  
  // Helper function to format platform name
  const formatPlatformName = (platform: string): string => {
    return platform
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get platform icon name
  const getPlatformIcon = (platform: string): string => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('youtube')) return 'youtube';
    if (platformLower.includes('instagram')) return 'instagram';
    if (platformLower.includes('tiktok')) return 'music-note';
    if (platformLower.includes('linkedin')) return 'linkedin';
    if (platformLower.includes('twitter')) return 'twitter';
    if (platformLower.includes('facebook')) return 'facebook';
    return 'script-text-outline';
  };
  
  // Handle save script
  const handleSaveScript = async () => {
    try {
      setSaving(true);
      
      // Create script object with updated title
      const scriptToSave = {
        ...initialScript,
        title,
        ideaId
      };
      
      // Save script
      const response = await saveScript(scriptToSave);
      
      // Navigate to script detail screen
      navigation.replace('ScriptDetail', { scriptId: response.data._id });
      
      // Show success message
      Alert.alert(
        'Success',
        'Script saved successfully',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to save script:', error);
      Alert.alert(
        'Error',
        'Failed to save script. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };
  
  // Handle discard
  const handleDiscard = () => {
    Alert.alert(
      'Discard Script',
      'Are you sure you want to discard this script? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          onPress: () => navigation.goBack(),
          style: 'destructive'
        }
      ]
    );
  };
  
  // Toggle title editing
  const toggleTitleEditing = () => {
    setEditingTitle(!editingTitle);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleDiscard}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>Script Preview</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Script Title (Editable) */}
        <View style={styles.titleContainer}>
          {editingTitle ? (
            <TextInput
              mode="outlined"
              value={title}
              onChangeText={setTitle}
              style={styles.titleInput}
              autoFocus
              onBlur={toggleTitleEditing}
              right={<TextInput.Icon icon="check" onPress={toggleTitleEditing} />}
            />
          ) : (
            <View style={styles.titleRow}>
              <Text variant="headlineMedium" style={styles.title}>{title}</Text>
              <IconButton
                icon="pencil"
                size={20}
                onPress={toggleTitleEditing}
                style={styles.editTitleButton}
              />
            </View>
          )}
        </View>
        
        {/* Platform and Duration */}
        <View style={styles.metaContainer}>
          <Chip 
            icon={() => (
              <MaterialCommunityIcons 
                name={getPlatformIcon(initialScript.platform)} 
                size={16} 
                color={theme.colors.primary} 
              />
            )}
            style={styles.platformChip}
          >
            {formatPlatformName(initialScript.platform)}
          </Chip>
          
          {initialScript.targetDuration && (
            <Chip 
              icon="clock-outline" 
              style={styles.durationChip}
            >
              {initialScript.targetDuration}
            </Chip>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Script Sections */}
        <Card style={styles.sectionCard}>
          <Card.Title title="Introduction" titleVariant="titleMedium" />
          <Card.Content>
            <Text variant="bodyMedium">{initialScript.intro}</Text>
          </Card.Content>
        </Card>
        
        <Text variant="titleMedium" style={styles.bodyTitle}>Main Content</Text>
        
        {initialScript.body.map((section: ScriptSection, index: number) => (
          <Card key={index} style={styles.sectionCard}>
            <Card.Title title={section.section} titleVariant="titleMedium" />
            <Card.Content>
              <Text variant="bodyMedium">{section.content}</Text>
              
              {section.visualDirection && (
                <View style={styles.visualDirectionContainer}>
                  <Text variant="bodySmall" style={styles.visualDirectionLabel}>Visual Direction:</Text>
                  <Text variant="bodySmall" style={styles.visualDirectionText}>{section.visualDirection}</Text>
                </View>
              )}
              
              {section.duration && (
                <Text variant="bodySmall" style={styles.durationText}>Duration: {section.duration}</Text>
              )}
            </Card.Content>
          </Card>
        ))}
        
        <Card style={styles.sectionCard}>
          <Card.Title title="Conclusion" titleVariant="titleMedium" />
          <Card.Content>
            <Text variant="bodyMedium">{initialScript.outro}</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.sectionCard}>
          <Card.Title title="Call to Action" titleVariant="titleMedium" />
          <Card.Content>
            <Text variant="bodyMedium">{initialScript.callToAction}</Text>
          </Card.Content>
        </Card>
        
        {/* B-Roll Suggestions */}
        {initialScript.bRollSuggestions && initialScript.bRollSuggestions.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Title title="B-Roll Suggestions" titleVariant="titleMedium" />
            <Card.Content>
              {initialScript.bRollSuggestions.map((suggestion: string, index: number) => (
                <View key={index} style={styles.listItem}>
                  <MaterialCommunityIcons 
                    name="video-outline" 
                    size={16} 
                    color={theme.colors.onSurfaceVariant} 
                    style={styles.listItemIcon}
                  />
                  <Text variant="bodyMedium">{suggestion}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
        
        {/* Tags */}
        {initialScript.tags && initialScript.tags.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Title title="Tags" titleVariant="titleMedium" />
            <Card.Content>
              <View style={styles.tagsContainer}>
                {initialScript.tags.map((tag: string, index: number) => (
                  <Chip 
                    key={index}
                    style={styles.tagChip}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button 
            mode="outlined" 
            onPress={handleDiscard}
            icon="close"
            style={styles.actionButton}
          >
            Discard
          </Button>
          
          <Button 
            mode="contained" 
            onPress={handleSaveScript}
            icon="content-save"
            style={styles.actionButton}
            loading={saving}
            disabled={saving}
          >
            Save Script
          </Button>
        </View>
        
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
  titleContainer: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
  },
  titleInput: {
    fontSize: 20,
  },
  editTitleButton: {
    marginLeft: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  platformChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  durationChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  sectionCard: {
    marginBottom: 16,
  },
  bodyTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  visualDirectionContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  visualDirectionLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  visualDirectionText: {
    fontStyle: 'italic',
  },
  durationText: {
    marginTop: 8,
    color: '#6B7280',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listItemIcon: {
    marginRight: 8,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  footer: {
    height: 40,
  },
});

export default ScriptPreviewScreen;