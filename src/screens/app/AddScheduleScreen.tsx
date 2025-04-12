// src/screens/app/AddScheduleScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Button, useTheme, TextInput, HelperText, IconButton, Menu, Divider, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getIdeasForScheduling, scheduleItem, SavedIdea } from '../../services/calendarService';

type ParamList = {
  AddSchedule: { ideaId?: string, ideaTitle?: string };
};

const AddScheduleScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'AddSchedule'>>();
  
  // Extract ideaId if passed from navigation
  const preselectedIdeaId = route.params?.ideaId;
  const preselectedIdeaTitle = route.params?.ideaTitle;
  
  // Form state
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(preselectedIdeaId || null);
  const [selectedIdeaTitle, setSelectedIdeaTitle] = useState<string>(preselectedIdeaTitle || '');
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [publishingPlatform, setPublishingPlatform] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [postingNotes, setPostingNotes] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ideaMenuVisible, setIdeaMenuVisible] = useState(false);
  const [platformMenuVisible, setPlatformMenuVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  // Platform options
  const platformOptions = [
    'YouTube', 'Instagram', 'Instagram Reels', 'TikTok', 'LinkedIn', 
    'Twitter', 'Facebook', 'Blog', 'Other'
  ];
  
  // Fetch available ideas
  useEffect(() => {
    fetchIdeas();
  }, []);
  
  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getIdeasForScheduling();
      setIdeas(response.data || []);
      
      // If no idea was preselected but we have ideas, select the first one
      if (!selectedIdeaId && response.data && response.data.length > 0) {
        setSelectedIdeaId(response.data[0]._id);
        setSelectedIdeaTitle(response.data[0].title);
      }
      
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
      setError('Failed to load available ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle idea selection
  const handleSelectIdea = (id: string, title: string) => {
    setSelectedIdeaId(id);
    setSelectedIdeaTitle(title);
    setIdeaMenuVisible(false);
    // Clear idea error if exists
    if (formErrors.ideaId) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.ideaId;
        return newErrors;
      });
    }
  };
  
  // Handle platform selection
  const handleSelectPlatform = (platform: string) => {
    setPublishingPlatform(platform);
    setPlatformMenuVisible(false);
    // Clear platform error if exists
    if (formErrors.publishingPlatform) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.publishingPlatform;
        return newErrors;
      });
    }
  };
  
  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setDatePickerVisible(false);
    
    if (selectedDate) {
      // Preserve the time from the current scheduledDate
      const newDate = new Date(selectedDate);
      newDate.setHours(
        scheduledDate.getHours(),
        scheduledDate.getMinutes(),
        scheduledDate.getSeconds()
      );
      setScheduledDate(newDate);
    }
  };
  
  // Handle time change
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setTimePickerVisible(false);
    
    if (selectedTime) {
      // Preserve the date from the current scheduledDate
      const newDate = new Date(scheduledDate);
      newDate.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        selectedTime.getSeconds()
      );
      setScheduledDate(newDate);
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!selectedIdeaId) {
      errors.ideaId = 'Please select an idea to schedule';
    }
    
    if (!publishingPlatform) {
      errors.publishingPlatform = 'Please select a publishing platform';
    }
    
    setFormErrors(errors);
    
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const data = {
        ideaId: selectedIdeaId!,
        scheduledDate: scheduledDate.toISOString(),
        publishingPlatform,
        priority,
        postingNotes: postingNotes || undefined,
        additionalDetails: additionalDetails || undefined
      };
      
      await scheduleItem(data);
      
      // Navigate back to calendar
      navigation.navigate('CalendarView');
      
    } catch (err) {
      console.error('Failed to schedule item:', err);
      setError('Failed to schedule item. Please try again.');
      setSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>Schedule Content</Text>
        <View style={styles.placeholderIcon} />
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Idea Selection */}
        <View style={styles.formGroup}>
          <Text variant="titleMedium" style={styles.formLabel}>Content to Schedule</Text>
          
          <Menu
            visible={ideaMenuVisible}
            onDismiss={() => setIdeaMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setIdeaMenuVisible(true)}
                icon="lightbulb-outline"
                style={styles.selectButton}
                contentStyle={styles.selectButtonContent}
              >
                {selectedIdeaTitle || 'Select Content Idea'}
              </Button>
            }
          >
            <Menu.Item 
              onPress={() => setIdeaMenuVisible(false)} 
              title="Select an idea:" 
              disabled={true} 
            />
            <Divider />
            {ideas.map(idea => (
              <Menu.Item
                key={idea._id}
                onPress={() => handleSelectIdea(idea._id, idea.title)}
                title={idea.title}
              />
            ))}
          </Menu>
          
          {formErrors.ideaId && (
            <HelperText type="error" visible={!!formErrors.ideaId}>
              {formErrors.ideaId}
            </HelperText>
          )}
        </View>
        
        {/* Date and Time Selection */}
        <View style={styles.formGroup}>
          <Text variant="titleMedium" style={styles.formLabel}>Schedule Date & Time</Text>
          
          <View style={styles.dateTimeRow}>
            <Button
              mode="outlined"
              onPress={() => setDatePickerVisible(true)}
              icon="calendar"
              style={[styles.dateTimeButton, styles.dateButton]}
            >
              {formatDate(scheduledDate)}
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => setTimePickerVisible(true)}
              icon="clock-outline"
              style={[styles.dateTimeButton, styles.timeButton]}
            >
              {formatTime(scheduledDate)}
            </Button>
          </View>
          
          {datePickerVisible && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
          
          {timePickerVisible && (
            <DateTimePicker
              value={scheduledDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>
        
        {/* Platform Selection */}
        <View style={styles.formGroup}>
          <Text variant="titleMedium" style={styles.formLabel}>Publishing Platform</Text>
          
          <Menu
            visible={platformMenuVisible}
            onDismiss={() => setPlatformMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setPlatformMenuVisible(true)}
                icon="monitor-cellphone"
                style={styles.selectButton}
                contentStyle={styles.selectButtonContent}
              >
                {publishingPlatform || 'Select Platform'}
              </Button>
            }
          >
            {platformOptions.map(platform => (
              <Menu.Item
                key={platform}
                onPress={() => handleSelectPlatform(platform)}
                title={platform}
              />
            ))}
          </Menu>
          
          {formErrors.publishingPlatform && (
            <HelperText type="error" visible={!!formErrors.publishingPlatform}>
              {formErrors.publishingPlatform}
            </HelperText>
          )}
        </View>
        
        {/* Priority Selection */}
        <View style={styles.formGroup}>
          <Text variant="titleMedium" style={styles.formLabel}>Priority</Text>
          
          <RadioButton.Group onValueChange={value => setPriority(value as 'low' | 'medium' | 'high')} value={priority}>
            <View style={styles.radioGroup}>
              <View style={styles.radioOption}>
                <RadioButton value="low" />
                <Text>Low</Text>
              </View>
              
              <View style={styles.radioOption}>
                <RadioButton value="medium" />
                <Text>Medium</Text>
              </View>
              
              <View style={styles.radioOption}>
                <RadioButton value="high" />
                <Text>High</Text>
              </View>
            </View>
          </RadioButton.Group>
        </View>
        
        {/* Posting Notes */}
        <View style={styles.formGroup}>
          <Text variant="titleMedium" style={styles.formLabel}>Posting Notes (Optional)</Text>
          
          <TextInput
            mode="outlined"
            value={postingNotes}
            onChangeText={setPostingNotes}
            placeholder="Add notes about this scheduled post"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>
        
        {/* Additional Details */}
        <View style={styles.formGroup}>
          <Text variant="titleMedium" style={styles.formLabel}>Additional Details (Optional)</Text>
          
          <TextInput
            mode="outlined"
            value={additionalDetails}
            onChangeText={setAdditionalDetails}
            placeholder="Add any additional details or context"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>
        
        {/* Error Message */}
        {error && (
          <Text style={[styles.errorMessage, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}
        
        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={submitting || loading}
          loading={submitting}
          style={styles.submitButton}
          icon="calendar-plus"
        >
          Schedule Content
        </Button>
        
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
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectButton: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  selectButtonContent: {
    justifyContent: 'flex-start',
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeButton: {
    justifyContent: 'flex-start',
  },
  dateButton: {
    flex: 0.65,
    marginRight: 8,
  },
  timeButton: {
    flex: 0.35,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textArea: {
    marginTop: 8,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    height: 40,
  },
});

export default AddScheduleScreen;