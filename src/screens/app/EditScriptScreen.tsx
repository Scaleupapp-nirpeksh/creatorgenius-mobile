// src/screens/app/EditScriptScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, useTheme, TextInput, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { getScriptById, updateScript, Script } from '../../services/scriptService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ParamList = {
  EditScript: { scriptId: string };
};

const EditScriptScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'EditScript'>>();
  const { scriptId } = route.params;
  
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state (would be expanded in a full implementation)
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [outro, setOutro] = useState('');
  const [callToAction, setCallToAction] = useState('');
  
  // Fetch script details on mount
  useEffect(() => {
    fetchScriptDetails();
  }, [scriptId]);
  
  const fetchScriptDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getScriptById(scriptId);
      const scriptData = response.data;
      
      // Set form state with script data
      setScript(scriptData);
      setTitle(scriptData.title);
      setIntro(scriptData.intro);
      setOutro(scriptData.outro);
      setCallToAction(scriptData.callToAction);
      
    } catch (err) {
      console.error(`Failed to fetch script ${scriptId}:`, err);
      setError('Failed to load script details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Create update object with changed fields
      const updates = {
        title,
        intro,
        outro,
        callToAction
      };
      
      // Update script
      await updateScript(scriptId, updates);
      
      // Navigate back to script detail
      navigation.navigate('ScriptDetail', { scriptId });
      
      // Show success message
      Alert.alert(
        'Success',
        'Script updated successfully',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error(`Failed to update script ${scriptId}:`, err);
      setError('Failed to update script. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Placeholder content for now - would need to be expanded into a full form
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>Edit Script</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>
      
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading script details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={{ color: theme.colors.error }}>{error}</Text>
            <Button mode="contained" onPress={fetchScriptDetails} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        ) : (
          <>
            <TextInput
              label="Title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="Introduction"
              value={intro}
              onChangeText={setIntro}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />
            
            <Text style={styles.sectionLabel}>Body sections would go here</Text>
            
            <TextInput
              label="Conclusion"
              value={outro}
              onChangeText={setOutro}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />
            
            <TextInput
              label="Call to Action"
              value={callToAction}
              onChangeText={setCallToAction}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
            
            <View style={styles.actionsContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.actionButton}
              >
                Cancel
              </Button>
              
              <Button
                mode="contained"
                onPress={handleSaveChanges}
                loading={saving}
                disabled={saving}
                style={styles.actionButton}
              >
                Save Changes
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
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginVertical: 16,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  retryButton: {
    marginTop: 16,
  },
});

export default EditScriptScreen;