// src/screens/app/FeedbackScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Snackbar,
  HelperText
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { getUserFeedbackApi, createFeedbackApi, Feedback } from '../../services/apiClient';

const FeedbackScreen: React.FC = () => {
  const theme = useTheme();

  // State to hold feedback list and form values
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [newFeedbackType, setNewFeedbackType] = useState<'feedback' | 'issue' | 'query'>('feedback');
  const [newFeedbackTitle, setNewFeedbackTitle] = useState<string>('');
  const [newFeedbackDescription, setNewFeedbackDescription] = useState<string>('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Fetch user feedback when component mounts (or refresh as needed)
  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await getUserFeedbackApi();
      if (response.success && response.data) {
        setFeedbackList(response.data);
      } else {
        setSnackbarMessage(response.message || 'Failed to load feedback');
        setSnackbarVisible(true);
      }
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Error fetching feedback');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // Handle submitting new feedback
  const handleSubmitFeedback = async () => {
    setFeedbackError(null);
    if (!newFeedbackTitle.trim() || !newFeedbackDescription.trim()) {
      setFeedbackError('Title and Description are required.');
      return;
    }
    try {
      const feedbackData = {
        type: newFeedbackType,
        title: newFeedbackTitle,
        description: newFeedbackDescription,
      };
      const response = await createFeedbackApi(feedbackData);
      if (response.success && response.data) {
        setSnackbarMessage('Feedback submitted successfully');
        setSnackbarVisible(true);
        setNewFeedbackTitle('');
        setNewFeedbackDescription('');
        // Refresh the feedback list after successful submission
        fetchFeedback();
      } else {
        setFeedbackError(response.message || 'Failed to submit feedback');
      }
    } catch (error: any) {
      setFeedbackError(error.message || 'Error submitting feedback');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text variant="headlineSmall" style={styles.heading}>My Feedback</Text>
      {loading ? (
        <ActivityIndicator animating={true} size="large" style={styles.loader} />
      ) : (
        feedbackList.map((item) => (
          <Card key={item._id} style={styles.card}>
            <Card.Title
              title={item.title}
              subtitle={`Type: ${item.type} | Status: ${item.status}`}
            />
            <Card.Content>
              <Text>{item.description}</Text>
              <Text variant="bodySmall" style={styles.timestamp}>

                Submitted: {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}

      <Card style={styles.formCard}>
        <Card.Title title="Submit New Feedback" />
        <Card.Content>
          <TextInput
            label="Title"
            mode="outlined"
            value={newFeedbackTitle}
            onChangeText={setNewFeedbackTitle}
            style={styles.input}
          />
          <TextInput
            label="Description"
            mode="outlined"
            value={newFeedbackDescription}
            onChangeText={setNewFeedbackDescription}
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          {/* Optionally, you can add a dropdown or radio buttons for type (feedback, issue, or query) */}
          {feedbackError && <HelperText type="error">{feedbackError}</HelperText>}
          <Button
            mode="contained"
            onPress={handleSubmitFeedback}
            style={styles.submitButton}
          >
            Submit Feedback
          </Button>
        </Card.Content>
      </Card>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  contentContainer: { paddingBottom: 40 },
  heading: { marginBottom: 16 },
  loader: { marginVertical: 20 },
  card: { marginBottom: 16 },
  timestamp: { marginTop: 8, color: 'gray' },
  formCard: { marginTop: 24, padding: 8 },
  input: { marginBottom: 12 },
  submitButton: { marginTop: 8 },
});

export default FeedbackScreen;
