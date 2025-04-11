// src/screens/app/ScheduleDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, Chip, IconButton, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { getScheduledItem, updateScheduledItem, deleteScheduledItem, ScheduledContent } from '../../services/calendarService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ParamList = {
  ScheduleDetail: { id: string };
};

const ScheduleDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'ScheduleDetail'>>();
  const { id } = route.params;
  
  const [scheduledItem, setScheduledItem] = useState<ScheduledContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Fetch scheduled item
  useEffect(() => {
    fetchScheduledItem();
  }, [id]);
  
  const fetchScheduledItem = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getScheduledItem(id);
      setScheduledItem(response.data);
      
    } catch (err) {
      console.error(`Failed to fetch scheduled item ${id}:`, err);
      setError('Failed to load scheduled item. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update status of the scheduled item
  const updateItemStatus = async (newStatus: 'scheduled' | 'in-progress' | 'posted' | 'delayed') => {
    if (!scheduledItem) return;
    
    try {
      setUpdating(true);
      setError(null);
      
      const response = await updateScheduledItem(id, { 
        status: newStatus 
      });
      
      setScheduledItem(response.data);
      setMenuVisible(false);
      
    } catch (err) {
      console.error(`Failed to update status for item ${id}:`, err);
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Delete scheduled item
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      
      await deleteScheduledItem(id);
      
      // Navigate back after deletion
      navigation.goBack();
      
    } catch (err) {
      console.error(`Failed to delete scheduled item ${id}:`, err);
      setError('Failed to delete item. Please try again.');
      setDeleting(false);
    }
  };
  
  // Navigate to edit screen
  const navigateToEdit = () => {
    if (!scheduledItem) return;
    
    navigation.navigate('EditSchedule', { 
      item: scheduledItem 
    });
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status color
  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      scheduled: theme.colors.primary,
      'in-progress': '#F59E0B',
      posted: '#10B981',
      delayed: '#EF4444',
    };
    
    return statusColors[status] || theme.colors.primary;
  };
  
  // Get priority icon
  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'flag';
      case 'medium':
        return 'flag-outline';
      case 'low':
        return 'flag-variant-outline';
      default:
        return 'flag-outline';
    }
  };
  
  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return theme.colors.primary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading scheduled item...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error || !scheduledItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>Error</Text>
          <View style={styles.placeholderIcon} />
        </View>
        
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="calendar-alert" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error || 'Failed to load scheduled item'}
          </Text>
          <Button mode="contained" onPress={fetchScheduledItem} style={styles.retryButton}>
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
        <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
          Scheduled Content
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
              navigateToEdit();
            }} 
            title="Edit" 
          />
          <Menu.Item 
            leadingIcon="check-circle" 
            onPress={() => updateItemStatus('posted')}
            title="Mark as Posted" 
            disabled={scheduledItem.status === 'posted' || updating}
          />
          <Menu.Item 
            leadingIcon="progress-clock" 
            onPress={() => updateItemStatus('in-progress')}
            title="Mark as In Progress" 
            disabled={scheduledItem.status === 'in-progress' || updating}
          />
          <Menu.Item 
            leadingIcon="calendar-clock" 
            onPress={() => updateItemStatus('scheduled')}
            title="Mark as Scheduled" 
            disabled={scheduledItem.status === 'scheduled' || updating}
          />
          <Divider />
          <Menu.Item 
            leadingIcon="delete" 
            onPress={() => {
              setMenuVisible(false);
              handleDelete();
            }}
            title="Delete" 
            disabled={deleting}
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.contentCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.contentTitle}>
              {scheduledItem.ideaId?.title || 'Untitled Content'}
            </Text>
            
            <View style={styles.statusContainer}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: `${getStatusColor(scheduledItem.status)}20` }]}
                textStyle={{ color: getStatusColor(scheduledItem.status) }}
              >
                {scheduledItem.status}
              </Chip>
              
              {scheduledItem.priority && (
                <Chip
                  icon={() => (
                    <MaterialCommunityIcons 
                      name={getPriorityIcon(scheduledItem.priority)} 
                      size={16} 
                      color={getPriorityColor(scheduledItem.priority)}
                    />
                  )}
                  style={styles.priorityChip}
                >
                  {scheduledItem.priority} priority
                </Chip>
              )}
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Schedule Details</Text>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons 
                  name="calendar" 
                  size={20} 
                  color={theme.colors.onSurfaceVariant}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium">{formatDate(scheduledItem.scheduledDate)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={20} 
                  color={theme.colors.onSurfaceVariant}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium">{formatTime(scheduledItem.scheduledDate)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons 
                  name="monitor-cellphone" 
                  size={20} 
                  color={theme.colors.onSurfaceVariant}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium">{scheduledItem.publishingPlatform}</Text>
              </View>
              
              {scheduledItem.dueDate && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons 
                    name="calendar-check" 
                    size={20} 
                    color={theme.colors.onSurfaceVariant}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyMedium">Due by: {formatDate(scheduledItem.dueDate)}</Text>
                </View>
              )}
            </View>
            
            {scheduledItem.postingNotes && (
              <View style={styles.detailSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Posting Notes</Text>
                <Text variant="bodyMedium">{scheduledItem.postingNotes}</Text>
              </View>
            )}
            
            {scheduledItem.additionalDetails && (
              <View style={styles.detailSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Additional Details</Text>
                <Text variant="bodyMedium">{scheduledItem.additionalDetails}</Text>
              </View>
            )}
            
            <View style={styles.detailSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Metadata</Text>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons 
                  name="clock-check-outline" 
                  size={20} 
                  color={theme.colors.onSurfaceVariant}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium">Created: {formatDate(scheduledItem.createdAt)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons 
                  name="update" 
                  size={20} 
                  color={theme.colors.onSurfaceVariant}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium">Last modified: {formatDate(scheduledItem.lastModified)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            onPress={navigateToEdit}
            icon="pencil"
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          >
            Edit
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleDelete}
            icon="delete"
            loading={deleting}
            disabled={deleting}
            style={styles.actionButton}
            textColor={theme.colors.error}
            buttonColor={theme.colors.errorContainer}
          >
            Delete
          </Button>
        </View>
        
        {error && (
          <Text style={[styles.errorMessage, { color: theme.colors.error }]}>
            {error}
          </Text>
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
  contentCard: {
    marginBottom: 16,
  },
  contentTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  priorityChip: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
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
  errorMessage: {
    textAlign: 'center',
    marginVertical: 12,
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

export default ScheduleDetailScreen;
