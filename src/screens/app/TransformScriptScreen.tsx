// src/screens/app/TransformScriptScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, useTheme, Checkbox, Chip, IconButton, ActivityIndicator, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { getScriptById, transformScript, saveTransformedScript, Script } from '../../services/scriptService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ParamList = {
  TransformScript: { scriptId: string };
};

interface PlatformOption {
  value: string;
  label: string;
  icon: string;
}

const TransformScriptScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'TransformScript'>>();
  const { scriptId } = route.params;
  
  // State
  const [originalScript, setOriginalScript] = useState<Script | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [transformedScripts, setTransformedScripts] = useState<any[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [transforming, setTransforming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Available platform options
  const platformOptions: PlatformOption[] = [
    { value: 'youtube_short', label: 'YouTube Shorts', icon: 'youtube' },
    { value: 'instagram_reel', label: 'Instagram Reel', icon: 'instagram' },
    { value: 'tiktok', label: 'TikTok', icon: 'music-note' },
    { value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { value: 'twitter', label: 'Twitter', icon: 'twitter' },
    { value: 'facebook', label: 'Facebook', icon: 'facebook' }
  ];
  
  // Fetch original script on mount
  useEffect(() => {
    fetchOriginalScript();
  }, [scriptId]);
  
  const fetchOriginalScript = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getScriptById(scriptId);
      setOriginalScript(response.data);
      
      // Remove the original script's platform from options
      const originalPlatform = response.data.platform;
      setSelectedPlatforms([]);
      
    } catch (err) {
      console.error(`Failed to fetch script ${scriptId}:`, err);
      setError('Failed to load original script. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle platform selection
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };
  
  // Transform script
  const handleTransformScript = async () => {
    if (selectedPlatforms.length === 0) {
      Alert.alert('Error', 'Please select at least one platform');
      return;
    }
    
    try {
      setTransforming(true);
      setError(null);
      
      const response = await transformScript(scriptId, { targetPlatforms: selectedPlatforms });
      setTransformedScripts(response.transformedScripts);
      
      // Set first transformed script as preview
      if (response.transformedScripts.length > 0) {
        setCurrentPreviewIndex(0);
      }
      
    } catch (err) {
      console.error(`Failed to transform script ${scriptId}:`, err);
      setError('Failed to transform script. Please try again.');
    } finally {
      setTransforming(false);
    }
  };
  
  // Save a transformed script
  const saveCurrentTransformedScript = async () => {
    if (currentPreviewIndex === null || !transformedScripts[currentPreviewIndex]) {
      return;
    }
    
    try {
      setSaving(true);
      
      const scriptToSave = {
        ...transformedScripts[currentPreviewIndex].script,
        originalScriptId: scriptId,
        ideaId: originalScript?.ideaId || null
      };
      
      const response = await saveTransformedScript(scriptToSave);
      
      // Navigate to the saved script
      navigation.replace('ScriptDetail', { scriptId: response.data._id });
      
      Alert.alert(
        'Success', 
        'Transformed script saved successfully',
        [{ text: 'OK' }]
      );
      
    } catch (err) {
      console.error('Failed to save transformed script:', err);
      Alert.alert('Error', 'Failed to save transformed script. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Format platform name
  const formatPlatformName = (platform: string): string => {
    return platform
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get platform icon
  const getPlatformIcon = (platform: string): string => {
    const option = platformOptions.find(opt => opt.value === platform);
    return option?.icon || 'help-circle';
  };
  
  // Render platform options
  const renderPlatformOptions = () => {
    // Filter out the original script's platform
    const filteredOptions = platformOptions.filter(option => 
      originalScript?.platform !== option.value
    );
    
    return filteredOptions.map(option => (
      <View key={option.value} style={styles.platformOption}>
        <View style={styles.checkboxContainer}>
          <MaterialCommunityIcons 
            name={option.icon} 
            size={24} 
            color={theme.colors.primary}
            style={styles.platformIcon} 
          />
          <Text style={styles.platformLabel}>{option.label}</Text>
          <Checkbox
            status={selectedPlatforms.includes(option.value) ? 'checked' : 'unchecked'}
            onPress={() => togglePlatform(option.value)}
          />
        </View>
      </View>
    ));
  };
  
  // Render transformed scripts list
  const renderTransformedList = () => {
    return transformedScripts.map((item, index) => (
      <List.Item
        key={item.platform}
        title={formatPlatformName(item.platform)}
        left={props => (
          <MaterialCommunityIcons 
            name={getPlatformIcon(item.platform)} 
            size={24} 
            color={theme.colors.primary}
            style={{ marginLeft: 8, alignSelf: 'center' }}
          />
        )}
        right={props => (
          <Button 
            mode={currentPreviewIndex === index ? 'contained' : 'outlined'}
            onPress={() => setCurrentPreviewIndex(index)}
            style={{ marginVertical: 4 }}
          >
            {currentPreviewIndex === index ? 'Viewing' : 'View'}
          </Button>
        )}
        style={[
          styles.transformedItem,
          currentPreviewIndex === index && { backgroundColor: theme.colors.primaryContainer }
        ]}
      />
    ));
  };
  
  // Render current preview
  const renderPreview = () => {
    if (currentPreviewIndex === null || !transformedScripts[currentPreviewIndex]) {
      return null;
    }
    
    const currentScript = transformedScripts[currentPreviewIndex].script;
    
    return (
      <Card style={styles.previewCard}>
        <Card.Title 
          title={currentScript.title} 
          subtitle={formatPlatformName(currentScript.platform)}
          left={props => (
            <MaterialCommunityIcons 
              name={getPlatformIcon(currentScript.platform)} 
              size={32} 
              color={theme.colors.primary} 
            />
          )}
        />
        <Card.Content>
          <Text variant="bodySmall" style={styles.previewLabel}>Introduction</Text>
          <Text variant="bodyMedium" style={styles.previewText}>{currentScript.intro}</Text>
          
          <Divider style={styles.divider} />
          
          <Text variant="bodySmall" style={styles.previewLabel}>
            Content ({currentScript.body.length} sections)
          </Text>
          <List.Accordion title="View Content Sections" style={styles.sectionsAccordion}>
            {currentScript.body.map((section: any, index: number) => (
              <List.Item
                key={index}
                title={section.section}
                description={section.content.substring(0, 60) + '...'}
                descriptionNumberOfLines={2}
                titleStyle={{ fontWeight: 'bold' }}
              />
            ))}
          </List.Accordion>
          
          <Divider style={styles.divider} />
          
          <Text variant="bodySmall" style={styles.previewLabel}>Conclusion</Text>
          <Text variant="bodyMedium" style={styles.previewText}>{currentScript.outro}</Text>
          
          <Divider style={styles.divider} />
          
          <Text variant="bodySmall" style={styles.previewLabel}>Call to Action</Text>
          <Text variant="bodyMedium" style={styles.previewText}>{currentScript.callToAction}</Text>
          
          <Button
            mode="contained"
            onPress={saveCurrentTransformedScript}
            style={styles.saveButton}
            loading={saving}
            disabled={saving}
            icon="content-save"
          >
            Save This Version
          </Button>
        </Card.Content>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading script...</Text>
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
        <Text variant="titleLarge" style={styles.headerTitle}>Transform Script</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Original Script Info */}
        {originalScript && (
          <Card style={styles.originalScriptCard}>
            <Card.Title 
              title={originalScript.title} 
              subtitle={`Original for ${formatPlatformName(originalScript.platform)}`}
              left={props => (
                <MaterialCommunityIcons 
                  name={getPlatformIcon(originalScript.platform)} 
                  size={32} 
                  color={theme.colors.primary} 
                />
              )}
            />
          </Card>
        )}
        
        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={{ color: theme.colors.error }}>{error}</Text>
            <Button mode="contained" onPress={fetchOriginalScript} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        )}
        
        {/* Transform Section - Select Platforms */}
        {!transformedScripts.length ? (
          <Card style={styles.transformCard}>
            <Card.Title title="Select Target Platforms" />
            <Card.Content>
              <Text variant="bodyMedium" style={styles.instructions}>
                Select which platforms you want to transform this script for:
              </Text>
              
              <View style={styles.platformsContainer}>
                {renderPlatformOptions()}
              </View>
              
              <Button
                mode="contained"
                onPress={handleTransformScript}
                loading={transforming}
                disabled={transforming || selectedPlatforms.length === 0}
                style={styles.transformButton}
                icon="transform"
              >
                {transforming ? 'Transforming...' : 'Transform Script'}
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <>
            {/* Transformed Results */}
            <View style={styles.resultsContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Transformed Versions
              </Text>
              
              <View style={styles.transformedList}>
                {renderTransformedList()}
              </View>
              
              {/* Preview Section */}
              {renderPreview()}
              
              {/* New Transform Button */}
              <Button
                mode="outlined"
                onPress={() => {
                  setTransformedScripts([]);
                  setCurrentPreviewIndex(null);
                }}
                style={styles.newTransformButton}
                icon="refresh"
              >
                New Transform
              </Button>
            </View>
          </>
        )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  originalScriptCard: {
    marginBottom: 16,
  },
  transformCard: {
    marginBottom: 16,
  },
  instructions: {
    marginBottom: 16,
  },
  platformsContainer: {
    marginBottom: 16,
  },
  platformOption: {
    marginVertical: 8,
    paddingVertical: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  platformIcon: {
    marginRight: 12,
  },
  platformLabel: {
    flex: 1,
    fontSize: 16,
  },
  transformButton: {
    marginTop: 8,
  },
  resultsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  transformedList: {
    marginBottom: 16,
  },
  transformedItem: {
    borderRadius: 8,
    marginBottom: 8,
  },
  previewCard: {
    marginBottom: 16,
  },
  previewLabel: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    color: '#6B7280',
  },
  previewText: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 8,
  },
  sectionsAccordion: {
    padding: 0,
  },
  saveButton: {
    marginTop: 16,
  },
  newTransformButton: {
    marginTop: 4,
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
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
});

export default TransformScriptScreen;