// src/screens/app/EditScheduleScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  Text,
  Button,
  useTheme,
  TextInput,
  HelperText,
  IconButton,
  Menu,
  Divider,
  RadioButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  getIdeasForScheduling,
  updateScheduledItem,
  ScheduledContent
} from '../../services/calendarService';

type ParamList = {
  EditSchedule: { item: ScheduledContent };
};

const EditScheduleScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'EditSchedule'>>();
  
  // Retrieve the item passed from ScheduleDetail screen
  const item = route.params.item;
  
  // Prepopulate state using the passed scheduled item
  const [ideas, setIdeas] = useState<{ _id: string; title: string }[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>(item.ideaId ? item.ideaId._id : '');
  const [selectedIdeaTitle, setSelectedIdeaTitle] = useState<string>(item.ideaId ? item.ideaId.title : '');
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date(item.scheduledDate));
  const [publishingPlatform, setPublishingPlatform] = useState<string>(item.publishingPlatform);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(item.priority);
  const [postingNotes, setPostingNotes] = useState<string>(item.postingNotes || '');
  const [additionalDetails, setAdditionalDetails] = useState<string>(item.additionalDetails || '');
  const [dueDate, setDueDate] = useState<Date | null>(item.dueDate ? new Date(item.dueDate) : null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ideaMenuVisible, setIdeaMenuVisible] = useState(false);
  const [platformMenuVisible, setPlatformMenuVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [dueDatePickerVisible, setDueDatePickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Options for platform selection
  const platformOptions = [
    'YouTube',
    'Instagram',
    'Instagram Reels',
    'TikTok',
    'LinkedIn',
    'Twitter',
    'Facebook',
    'Blog',
    'Other'
  ];

  // Fetch available ideas for scheduling on mount
  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getIdeasForScheduling();
      const ideasList = response.data;
      setIdeas(ideasList);

      // If there is no idea selected (should already be prepopulated), select the first one.
      if (!selectedIdeaId && ideasList.length > 0) {
        setSelectedIdeaId(ideasList[0]._id);
        setSelectedIdeaTitle(ideasList[0].title);
      }
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
      setError('Failed to load ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handlers for idea selection
  const handleSelectIdea = (id: string, title: string) => {
    setSelectedIdeaId(id);
    setSelectedIdeaTitle(title);
    setIdeaMenuVisible(false);
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
    if (formErrors.publishingPlatform) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.publishingPlatform;
        return newErrors;
      });
    }
  };

  // Date and time pickers for scheduledDate
  const handleDateChange = (event: any, selected?: Date) => {
    setDatePickerVisible(false);
    if (selected) {
      const newDate = new Date(selected);
      newDate.setHours(scheduledDate.getHours(), scheduledDate.getMinutes(), scheduledDate.getSeconds());
      setScheduledDate(newDate);
    }
  };

  const handleTimeChange = (event: any, selected?: Date) => {
    setTimePickerVisible(false);
    if (selected) {
      const newDate = new Date(scheduledDate);
      newDate.setHours(selected.getHours(), selected.getMinutes(), selected.getSeconds());
      setScheduledDate(newDate);
    }
  };

  // Due date picker handler (optional)
  const handleDueDateChange = (event: any, selected?: Date) => {
    setDueDatePickerVisible(false);
    if (selected) {
      setDueDate(selected);
    }
  };

  // Validate required form fields
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!selectedIdeaId) {
      errors.ideaId = 'Please select an idea';
    }
    if (!publishingPlatform) {
      errors.publishingPlatform = 'Please select a publishing platform';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit updated data
  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      setError(null);
      
      const data = {
        ideaId: selectedIdeaId,
        scheduledDate: scheduledDate.toISOString(),
        publishingPlatform,
        priority,
        postingNotes: postingNotes || undefined,
        additionalDetails: additionalDetails || undefined,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      };

      await updateScheduledItem(item._id, data);
      
      // After successfully updating, navigate back (or to a refreshed detail screen)
      navigation.goBack();
    } catch (err) {
      console.error('Failed to update scheduled item:', err);
      setError('Failed to update scheduled item. Please try again.');
      setSubmitting(false);
    }
  };

  // Utility functions to format date and time for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={styles.headerTitle}>Edit Schedule</Text>
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
            <Menu.Item onPress={() => setIdeaMenuVisible(false)} title="Select an idea:" disabled />
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

        {/* Schedule Date & Time */}
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

        {/* Due Date Selection (Optional) */}
        <View style={styles.formGroup}>
          <Text variant="titleMedium" style={styles.formLabel}>Due Date (Optional)</Text>
          <Button
            mode="outlined"
            onPress={() => setDueDatePickerVisible(true)}
            icon="calendar"
            style={styles.selectButton}
          >
            {dueDate ? formatDate(dueDate) : 'Select Due Date'}
          </Button>
          {dueDatePickerVisible && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDueDateChange}
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
          <RadioButton.Group
            onValueChange={value => setPriority(value as 'low' | 'medium' | 'high')}
            value={priority}
          >
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
          icon="content-save"
        >
          Update Schedule
        </Button>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: 'bold' },
  placeholderIcon: { width: 24, marginRight: 16 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16 },
  formGroup: { marginBottom: 24 },
  formLabel: { fontWeight: 'bold', marginBottom: 8 },
  selectButton: { width: '100%', justifyContent: 'flex-start' },
  selectButtonContent: { justifyContent: 'flex-start' },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateTimeButton: { justifyContent: 'flex-start' },
  dateButton: { flex: 0.65, marginRight: 8 },
  timeButton: { flex: 0.35 },
  radioGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 8 },
  radioOption: { flexDirection: 'row', alignItems: 'center' },
  textArea: { marginTop: 8 },
  submitButton: { marginTop: 8, marginBottom: 24 },
  errorMessage: { textAlign: 'center', marginVertical: 12 },
  footer: { height: 40 }
});

export default EditScheduleScreen;
