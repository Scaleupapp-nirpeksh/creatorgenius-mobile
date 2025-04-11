// src/screens/app/ScriptDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Share, TouchableOpacity } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator, Chip, IconButton, Menu, Dialog, Portal, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { getScriptById, deleteScript, Script } from '../../services/scriptService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ParamList = {
  ScriptDetail: { scriptId: string };
};

const ScriptDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'ScriptDetail'>>();
  const { scriptId } = route.params;
  
  // State
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  
  // Fetch script details
  useEffect(() => {
    fetchScriptDetails();
  }, [scriptId]);
  
  const fetchScriptDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getScriptById(scriptId);
      setScript(response.data);
    } catch (err) {
      console.error(`Failed to fetch script ${scriptId}:`, err);
      setError('Failed to load script details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle section expansion
  const toggleSection = (sectionIndex: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex]
    }));
  };
  
  // Handle delete
  const handleDeleteScript = async () => {
    try {
      setDeleting(true);
      await deleteScript(scriptId);
      
      // Navigate back after successful deletion
      navigation.goBack();
    } catch (err) {
      console.error(`Failed to delete script ${scriptId}:`, err);
      setError('Failed to delete script. Please try again.');
      setDeleting(false);
    }
  };
  
  // Handle share
  const handleShareScript = async () => {
    if (!script) return;
    
    try {
      let shareText = `${script.title}\n\n`;
      shareText += `Platform: ${script.platform}\n\n`;
      shareText += `INTRO:\n${script.intro}\n\n`;
      
      // Add body sections
      script.body.forEach((section, index) => {
        shareText += `${section.section.toUpperCase()}:\n${section.content}\n\n`;
      });
      
      shareText += `OUTRO:\n${script.outro}\n\n`;
      shareText += `CALL TO ACTION:\n${script.callToAction}\n\n`;
      
      await Share.share({
        message: shareText,
        title: script.title
      });
    } catch (error) {
      console.error('Error sharing script:', error);
    }
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  
  // Navigation functions
  const navigateToEditScript = () => {
    navigation.navigate('EditScript', { scriptId });
  };
  
  const navigateToTransformScript = () => {
    navigation.navigate('TransformScript', { scriptId });
  };
  
  // Platform icon helper
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
  
  if (error || !script) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>Error</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons 
            name="script-text-outline" 
            size={64} 
            color={theme.colors.error} 
          />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error || 'Failed to load script details'}
          </Text>
          <Button 
            mode="contained" 
            onPress={fetchScriptDetails} 
            style={styles.retryButton}
          >
            Retry
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
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
        <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
          Script Detail
        </Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item 
            leadingIcon="pencil" 
            onPress={() => {
              setMenuVisible(false);
              navigateToEditScript();
            }} 
            title="Edit" 
          />
          <Menu.Item 
            leadingIcon="format-list-group" 
            onPress={() => {
              setMenuVisible(false);
              navigateToTransformScript();
            }} 
            title="Transform for other platforms" 
          />
          <Menu.Item 
            leadingIcon="share-variant" 
            onPress={() => {
              setMenuVisible(false);
              handleShareScript();
            }} 
            title="Share" 
          />
          <Divider />
          <Menu.Item 
            leadingIcon="delete" 
            onPress={() => {
              setMenuVisible(false);
              setConfirmDeleteVisible(true);
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
        <Text variant="headlineMedium" style={styles.title}>{script.title}</Text>
        
        <View style={styles.metaContainer}>
          <Chip 
            icon={() => (
              <MaterialCommunityIcons 
                name={getPlatformIcon(script.platform)} 
                size={16} 
                color={theme.colors.primary} 
              />
            )}
            style={styles.platformChip}
          >
            {script.platform.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Chip>
          
          {script.targetDuration && (
            <Chip 
              icon="clock-outline" 
              style={styles.durationChip}
            >
              {script.targetDuration}
            </Chip>
          )}
          
          {script.isTransformed && (
            <Chip 
              icon="transform" 
              style={styles.transformedChip}
            >
              Transformed
            </Chip>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <Text variant="bodySmall" style={styles.infoText}>
            Created: {formatDate(script.createdAt)}
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            Last Modified: {formatDate(script.lastModified)}
          </Text>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Intro Section */}
        <View style={styles.sectionContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Intro</Text>
          <View style={styles.sectionContent}>
            <Text variant="bodyMedium">{script.intro}</Text>
          </View>
        </View>
        
        {/* Body Sections */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Content</Text>
        {script.body.map((section, index) => (
          <View key={index} style={styles.bodySectionContainer}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection(index)}
            >
              <Text variant="titleSmall" style={styles.sectionName}>{section.section}</Text>
              <IconButton
                icon={expandedSections[index] ? "chevron-up" : "chevron-down"}
                size={20}
              />
            </TouchableOpacity>
            
            {(expandedSections[index] || true) && ( // Always show for now, but you can use expandedSections for collapsible sections
              <View style={styles.sectionContent}>
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
              </View>
            )}
          </View>
        ))}
        
        {/* Outro Section */}
        <View style={styles.sectionContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Outro</Text>
          <View style={styles.sectionContent}>
            <Text variant="bodyMedium">{script.outro}</Text>
          </View>
        </View>
        
        {/* Call to Action */}
        <View style={styles.sectionContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Call to Action</Text>
          <View style={styles.sectionContent}>
            <Text variant="bodyMedium">{script.callToAction}</Text>
          </View>
        </View>
        
        {/* B-Roll Suggestions */}
        {script.bRollSuggestions && script.bRollSuggestions.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle}>B-Roll Suggestions</Text>
            <View style={styles.sectionContent}>
              {script.bRollSuggestions.map((suggestion, index) => (
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
            </View>
          </View>
        )}
        
        {/* Tags */}
        {script.tags && script.tags.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {script.tags.map((tag, index) => (
                <Chip 
                  key={index}
                  style={styles.tagChip}
                >
                  {tag}
                </Chip>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            onPress={navigateToEditScript}
            icon="pencil"
            style={styles.actionButton}
          >
            Edit Script
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={navigateToTransformScript}
            icon="format-list-group"
            style={styles.actionButton}
          >
            Transform
          </Button>
        </View>
        
        <View style={styles.footer} />
      </ScrollView>
      
      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={confirmDeleteVisible} onDismiss={() => setConfirmDeleteVisible(false)}>
          <Dialog.Title>Delete Script</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete "{script.title}"? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleDeleteScript} 
              textColor={theme.colors.error}
              loading={deleting}
              disabled={deleting}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  platformChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  durationChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  transformedChip: {
    marginBottom: 8,
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoText: {
    color: '#6B7280',
    marginBottom: 4,
  },
  divider: {
    marginBottom: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  bodySectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    paddingLeft: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sectionName: {
    fontWeight: 'bold',
  },
  visualDirectionContainer: {
    marginTop: 8,
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
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginBottom: 12,
  },
  backButton: {
    marginTop: 8,
  },
  footer: {
    height: 40,
  },
});

export default ScriptDetailScreen;