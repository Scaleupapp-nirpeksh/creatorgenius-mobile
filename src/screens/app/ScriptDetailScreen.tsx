// src/screens/app/ScriptDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Share, TouchableOpacity } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator, Chip, IconButton, Menu, Divider, Dialog, Portal } from 'react-native-paper';
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

  // State variables
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({});

  // Fetch script details on mount or when scriptId changes
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

  // Navigation and action functions:
  const navigateToEditScript = () => {
    navigation.navigate('EditScript', { scriptId });
  };

  const navigateToScheduleScript = () => {
    navigation.navigate('ScheduleScript', { scriptId });
  };

  const navigateToSeo = () => {
    navigation.navigate('SEO', { 
      screen: 'SeoAnalysis',
      params: {
        prefillData: {
          topic: script?.title || '',
          currentTitle: script?.title || '',
          keywords: script?.tags ? script.tags.join(', ') : '',
          contentText: createContentText(),
          platform: script?.platform || ''
        },
        scriptId: script?._id
      }
    });
  };

  const handleShareScript = async () => {
    if (!script) return;
    try {
      let shareText = `${script.title}\n\nPlatform: ${script.platform}\n\nINTRO:\n${script.intro}\n\n`;
      script.body.forEach((section, index) => {
        shareText += `${section.section.toUpperCase()}:\n${section.content}\n\n`;
      });
      shareText += `OUTRO:\n${script.outro}\n\nCALL TO ACTION:\n${script.callToAction}\n\n`;
      await Share.share({ message: shareText, title: script.title });
    } catch (error) {
      console.error('Error sharing script:', error);
    }
  };

  const handleDeleteScript = async () => {
    try {
      setDeleting(true);
      await deleteScript(scriptId);
      navigation.goBack();
    } catch (err) {
      console.error(`Failed to delete script ${scriptId}:`, err);
      setError('Failed to delete script. Please try again.');
      setDeleting(false);
    }
  };

  // Create combined content text from intro, body, and outro
  const createContentText = (): string => {
    if (!script) return '';
    let contentText = script.intro + "\n\n";
    script.body.forEach(section => {
      contentText += `${section.section}:\n${section.content}\n\n`;
    });
    contentText += "Conclusion:\n" + script.outro;
    return contentText;
  };

  // Toggle expansion of a body section
  const toggleSection = (sectionIndex: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  // Format date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Helper to return the platform icon (e.g., for YouTube, Instagram, etc.)
  const getPlatformIcon = (platform: string): string => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) return 'youtube';
    if (p.includes('instagram')) return 'instagram';
    if (p.includes('tiktok')) return 'music-note';
    if (p.includes('linkedin')) return 'linkedin';
    if (p.includes('twitter')) return 'twitter';
    if (p.includes('facebook')) return 'facebook';
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
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={styles.headerTitle}>Error</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="script-text-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error || 'Failed to load script details'}
          </Text>
          <Button mode="contained" onPress={fetchScriptDetails} style={styles.retryButton}>
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
            title="Refine Script"
          />
          <Menu.Item
            leadingIcon="calendar-plus"
            onPress={() => {
              setMenuVisible(false);
              navigateToScheduleScript();
            }}
            title="Schedule"
          />
          <Menu.Item
            leadingIcon="magnify"
            onPress={() => {
              setMenuVisible(false);
              navigateToSeo();
            }}
            title="SEO Analyser"
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

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="headlineMedium" style={styles.title}>{script.title}</Text>
        <View style={styles.metaContainer}>
          <Chip
            icon={() => (
              <MaterialCommunityIcons name={getPlatformIcon(script.platform)} size={16} color={theme.colors.primary} />
            )}
            style={styles.platformChip}
          >
            {script.platform
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </Chip>
          {script.targetDuration && (
            <Chip icon="clock-outline" style={styles.durationChip}>
              {script.targetDuration}
            </Chip>
          )}
          {script.isTransformed && (
            <Chip icon="transform" style={styles.transformedChip}>
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
        {script.body.map((section, index: number) => (
          <View key={index} style={styles.bodySectionContainer}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(index)}>
              <Text variant="titleSmall" style={styles.sectionName}>{section.section}</Text>
              <IconButton icon={expandedSections[index] ? "chevron-up" : "chevron-down"} size={20} />
            </TouchableOpacity>
            {(expandedSections[index] || true) && (
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
              {script.bRollSuggestions.map((suggestion: string, index: number) => (
                <View key={index} style={styles.listItem}>
                  <MaterialCommunityIcons name="video-outline" size={16} color={theme.colors.onSurfaceVariant} style={styles.listItemIcon} />
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
              {script.tags.map((tag: string, index: number) => (
                <Chip key={index} style={styles.tagChip}>
                  {tag}
                </Chip>
              ))}
            </View>
          </View>
        )}

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
            <Button onPress={handleDeleteScript} textColor={theme.colors.error} loading={deleting} disabled={deleting}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: 'bold' },
  headerRightPlaceholder: { width: 24, marginRight: 16 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16 },
  title: { fontWeight: 'bold', marginBottom: 12 },
  metaContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  platformChip: { marginRight: 8, marginBottom: 8 },
  durationChip: { marginRight: 8, marginBottom: 8 },
  transformedChip: { marginBottom: 8 },
  infoContainer: { marginBottom: 16 },
  infoText: { color: '#6B7280', marginBottom: 4 },
  divider: { marginBottom: 16 },
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  sectionContent: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8 },
  bodySectionContainer: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 8, paddingLeft: 12, borderRadius: 8, marginBottom: 4 },
  sectionName: { fontWeight: 'bold' },
  visualDirectionContainer: { marginTop: 8, padding: 8, backgroundColor: '#eff6ff', borderRadius: 8 },
  visualDirectionLabel: { fontWeight: 'bold', marginBottom: 4 },
  visualDirectionText: { fontStyle: 'italic' },
  durationText: { marginTop: 8, color: '#6B7280' },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  listItemIcon: { marginRight: 8, marginTop: 4 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tagChip: { marginRight: 8, marginBottom: 8 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, marginBottom: 8 },
  actionButton: { flex: 1, marginHorizontal: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { marginTop: 8, marginBottom: 16, textAlign: 'center' },
  retryButton: { marginBottom: 12 },
  backButton: { marginTop: 8 },
  footer: { height: 40 },
  headerSurface: { borderRadius: 16, marginBottom: 24, elevation: 2 },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  userName: { fontWeight: 'bold', marginRight: 12 },
  welcomeText: { color: '#6B7280', fontWeight: '500' },
  dateText: { color: '#6B7280', marginTop: 6 },
  avatarContainer: { marginLeft: 16 },
  avatar: { elevation: 4, borderWidth: 2, borderColor: 'white' },
  subscriptionBadgeContainer: { marginBottom: 4 },
  subscriptionBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, elevation: 2 },
  subscriptionIcon: { marginRight: 4 },
  subscriptionText: { fontSize: 12, fontWeight: 'bold' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statsCardsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', padding: 16, borderRadius: 16, marginBottom: 16, elevation: 2, alignItems: 'center' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontWeight: 'bold', fontSize: 24, color: '#1F2937' },
  statLabel: { color: '#6B7280', textAlign: 'center', marginTop: 4 },
  dailyStatsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dailyStatCard: { width: '48%', borderRadius: 16, marginBottom: 16, elevation: 2, overflow: 'hidden' },
  dailyStatContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  dailyIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dailyStatInfo: { flex: 1 },
  dailyStatLabel: { color: '#6B7280', marginBottom: 2, fontSize: 13 },
  dailyStatValue: { fontWeight: 'bold', color: '#1F2937' },
  contentCard: { borderRadius: 16, padding: 16, elevation: 2 },
  calendarItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dateChip: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 12, minWidth: 60, alignItems: 'center' },
  calendarItemContent: { flex: 1 },
  platformText: { color: '#6B7280', marginTop: 2 },
  ideaItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  ideaIconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  ideaItemContent: { flex: 1 },
  ideaAngle: { color: '#6B7280', marginTop: 2 },
  emptyStateContainer: { alignItems: 'center', padding: 24 },
  emptyStateText: { color: '#6B7280', marginTop: 12, marginBottom: 16 },
  emptyStateButton: { marginTop: 8 },
  toolkitGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  toolCard: { width: '100%', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 2 },
  toolCardContent: { padding: 20, alignItems: 'center', height: 140, justifyContent: 'center' },
  toolCardTitle: { marginTop: 12, fontWeight: '600', textAlign: 'center' },
  toolCardDescription: { marginTop: 4, textAlign: 'center', color: '#6B7280', fontSize: 12 },
  logoutButton: { marginTop: 8, marginBottom: 24, alignSelf: 'center', borderColor: '#EF4444', borderRadius: 30, borderWidth: 1.5, width: '60%' },
  logoutButtonContent: { paddingVertical: 6 },
});

export default ScriptDetailScreen;
