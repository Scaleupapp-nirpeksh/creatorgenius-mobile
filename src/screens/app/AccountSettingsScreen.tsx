// src/screens/app/AccountSettingsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Button,
  useTheme,
  Avatar,
  Card,
  Divider,
  List,
  TextInput,
  HelperText,
  ActivityIndicator,
  Snackbar,
  Portal,
  Chip,
  TouchableRipple, // Used for List.Item interaction
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getCurrentUserApi,
  updateUserProfileApi,
  updatePasswordApi, // API for password update
  User,
  UpdateUserProfileData,
  UpdatePasswordData, // Type for password update
} from '../../services/apiClient';

const AccountSettingsScreen = () => {
  // --- Hooks ---
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  // --- State ---
  const [localUser, setLocalUser] = useState<User | null>(authUser);

  // Profile Edit State
  const [name, setName] = useState(localUser?.name || '');
  const [interests, setInterests] = useState<string[]>(localUser?.interests || []);
  const [preferences, setPreferences] = useState<User['preferences']>(
      localUser?.preferences || { newsSources: [], preferredNewsLanguage: 'en' }
  );
  const [interestInput, setInterestInput] = useState<string>('');
  const [newsSourceInput, setNewsSourceInput] = useState<string>('');
  const [editMode, setEditMode] = useState(false); // Profile edit mode (name, prefs, interests)
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isPasswordSectionVisible, setIsPasswordSectionVisible] = useState(false);
  const [secureTextEntryCurrent, setSecureTextEntryCurrent] = useState(true);
  const [secureTextEntryNew, setSecureTextEntryNew] = useState(true);
  const [secureTextEntryConfirm, setSecureTextEntryConfirm] = useState(true);

  // General Feedback State
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // --- Effects ---
  // Fetch data on focus
  useFocusEffect(
    useCallback(() => {
      const fetchDataOnFocus = async () => {
        console.log('Fetching latest user data for settings screen...');
        try {
          const freshUser = await getCurrentUserApi();
          setLocalUser(freshUser);
          setUser(freshUser); // Update global store too
          // Reset form fields only if NOT editing profile OR password section is closed
          if (!editMode && !isPasswordSectionVisible) {
            setName(freshUser.name || '');
            setInterests(freshUser.interests || []);
            setPreferences(freshUser.preferences || { newsSources: [], preferredNewsLanguage: 'en' });
            setInterestInput('');
            setNewsSourceInput('');
          }
          // Don't clear password fields on focus
          console.log('User data refreshed.');
        } catch (error: any) {
          console.error('Failed to fetch user data:', error);
          showSnackbar(error.message || 'Failed to load latest profile data');
        }
      };
      fetchDataOnFocus();
    }, [setUser, editMode, isPasswordSectionVisible]) // Dependencies
  );

  // --- Handlers ---
  // Snackbar
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Preferences & Interests
  const handleAddInterest = () => {
    const newInterest = interestInput.trim();
    if (newInterest && !interests.includes(newInterest) && interests.length < 15) {
      setInterests([...interests, newInterest]); setInterestInput(''); if (!editMode) setEditMode(true);
    } else if (interests.length >= 15) { showSnackbar('Max 15 interests allowed.'); }
    else if (interests.includes(newInterest)) { showSnackbar('Interest already added.'); }
  };
  const handleDeleteInterest = (interestToDelete: string) => { setInterests(i => i.filter(interest => interest !== interestToDelete)); if (!editMode) setEditMode(true); };
  const handleUpdateLanguage = (lang: string) => { setPreferences(p => ({ ...(p || {}), preferredNewsLanguage: lang.toLowerCase() })); if (!editMode) setEditMode(true); };
  const handleAddNewsSource = () => {
    const newSource = newsSourceInput.trim();
    if (newSource && !(preferences?.newsSources || []).includes(newSource)) {
      setPreferences(p => ({ ...(p || {}), newsSources: [...(p?.newsSources || []), newSource] })); setNewsSourceInput(''); if (!editMode) setEditMode(true);
    } else if ((preferences?.newsSources || []).includes(newSource)) { showSnackbar('News source already added.'); }
  };
  const handleDeleteNewsSource = (sourceToDelete: string) => { setPreferences(p => ({ ...(p || {}), newsSources: (p?.newsSources || []).filter(s => s !== sourceToDelete) })); if (!editMode) setEditMode(true); };

  // Profile Update (Name, Interests, Preferences)
  const handleUpdateProfile = async () => {
    if (!localUser) return;
    if (!name.trim()) { setProfileError('Name cannot be empty'); return; }
    setIsSavingProfile(true); setProfileError(null);
    try {
      const updateData: UpdateUserProfileData = {}; let hasChanges = false;
      if (name.trim() !== localUser.name) { updateData.name = name.trim(); hasChanges = true; }
      const originalInterests = (localUser.interests || []).sort(); const currentInterests = [...interests].sort();
      if (JSON.stringify(currentInterests) !== JSON.stringify(originalInterests)) { updateData.interests = interests; hasChanges = true; }
      let prefChanged = false; const currentPrefs = preferences || {}; const originalPrefs = localUser.preferences || {};
      if ((currentPrefs.preferredNewsLanguage || 'en') !== (originalPrefs.preferredNewsLanguage || 'en')) { prefChanged = true; }
      const originalSources = (originalPrefs.newsSources || []).sort(); const currentSources = [...(currentPrefs.newsSources || [])].sort();
      if (JSON.stringify(currentSources) !== JSON.stringify(originalSources)) { prefChanged = true; }
      if (prefChanged) { updateData.preferences = preferences; hasChanges = true; }

      if (hasChanges) {
        const response = await updateUserProfileApi(updateData);
        if (response.success && response.data) {
          setUser(response.data); setLocalUser(response.data);
          setName(response.data.name || ''); setInterests(response.data.interests || []); setPreferences(response.data.preferences || { newsSources: [], preferredNewsLanguage: 'en' });
          showSnackbar('Profile updated successfully!'); setEditMode(false);
        } else { throw new Error(response.message || 'Failed to update profile.'); }
      } else { showSnackbar('No changes detected.'); setEditMode(false); }
    } catch (err: any) { console.error("Profile update failed:", err); setProfileError(err.message || 'Error updating profile.'); showSnackbar(`Error: ${err.message || 'Profile update failed.'}`); }
    finally { setIsSavingProfile(false); }
  };

  // Cancel Profile Edit
  const handleCancelEdit = () => {
    setEditMode(false); setProfileError(null);
    if (localUser) {
      setName(localUser.name || ''); setInterests(localUser.interests || []); setPreferences(localUser.preferences || { newsSources: [], preferredNewsLanguage: 'en' });
      setInterestInput(''); setNewsSourceInput('');
    }
  };

  // Password Update
  const handlePasswordUpdate = async () => {
    setPasswordError(null);
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError('All password fields are required.'); return; }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters long.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    if (currentPassword === newPassword) { setPasswordError('New password must be different from the current one.'); return; }

    setPasswordLoading(true);
    try {
      const response = await updatePasswordApi({ currentPassword, newPassword });
      if (response.success) {
        showSnackbar('Password updated successfully!');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setPasswordError(null); setIsPasswordSectionVisible(false);
      } // Error handled by catch block due to API client structure
    } catch (error: any) { console.error('Password Update Failed:', error); const message = error.message || 'Password update failed.'; setPasswordError(message); showSnackbar(`Error: ${message}`); }
    finally { setPasswordLoading(false); }
  };

  // Logout Confirmation
  const handleLogout = () => {
      Alert.alert(
          "Confirm Logout",
          "Are you sure you want to log out?",
          [
              { text: "Cancel", style: "cancel" },
              { text: "Log Out", style: "destructive", onPress: logout } // Call original logout on confirm
          ]
      );
  };


  // --- Helper Functions ---
  const getInitials = (nameStr: string | undefined): string => {
    if (!nameStr) return '?'; const names = nameStr.trim().split(' ');
    return names.length > 1 && names[names.length - 1] ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : nameStr[0].toUpperCase();
  };
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A'; const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const getSubscriptionName = (tier: string | undefined): string => {
    switch (tier) { case 'creator_pro': return 'Creator Pro'; case 'agency_growth': return 'Agency Growth'; default: return 'Free Tier'; }
  };

  // --- Define Styles INSIDE Component ---
  const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    profileCard: { marginBottom: 20, elevation: 3, borderRadius: 12 },
    profileHeader: { flexDirection: 'row', alignItems: 'center' },
    profileInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    profileName: { fontWeight: 'bold', marginBottom: 4 },
    profileEmail: { color: theme.colors.onSurfaceVariant },
    profileActions: { flexDirection: 'row', marginTop: 12, flexWrap: 'wrap' },
    sectionCard: { marginBottom: 20, elevation: 3, borderRadius: 12 },
    subscriptionDetails: {},
    subscriptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    subscriptionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    subscriptionText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    upgradeButton: { marginTop: 16, borderRadius: 30 },
    viewMoreButton: { marginTop: 12, alignSelf: 'flex-start' },
    logoutButton: { marginTop: 24, borderColor: theme.colors.error, borderWidth: 1.5, borderRadius: 30 },
    logoutButtonContent: { paddingVertical: 8 },
    editButton: { marginRight: 8, marginBottom: 8, borderRadius: 20 },
    subHeading: { marginTop: 16, marginBottom: 8, fontWeight: 'bold' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    chip: { marginRight: 8, marginBottom: 8, borderColor: theme.colors.outline }, // Use theme color
    addInputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 },
    addInput: { flex: 1, marginRight: 8 },
    addButton: {},
    divider: { marginVertical: 16, backgroundColor: theme.colors.outlineVariant },
    placeholderText: { color: theme.colors.onSurfaceDisabled, fontStyle: 'italic', paddingVertical: 8 },
    textInput: { backgroundColor: 'transparent' },
    passwordSection: { paddingTop: 8, paddingBottom: 16, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant, marginTop: 8 },
    passwordInput: { marginBottom: 12, backgroundColor: 'transparent' },
  });
  // --- End Styles Definition ---

  // --- Render Logic ---
  if (!localUser) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={{ marginTop: 16 }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <Portal.Host>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* --- Profile Card --- */}
          <Card style={styles.profileCard}>
            <Card.Content>
              <View style={styles.profileHeader}>
                {localUser?.profilePictureUrl ? <Avatar.Image size={80} source={{ uri: localUser.profilePictureUrl }} /> : <Avatar.Text size={80} label={getInitials(localUser?.name)} style={{ backgroundColor: theme.colors.primary }} labelStyle={{ color: theme.colors.onPrimary }} />}
                <View style={styles.profileInfo}>
                  {editMode ? ( <TextInput mode="outlined" label="Name" value={name} onChangeText={setName} style={styles.textInput} error={!!profileError && profileError.includes('Name')} disabled={isSavingProfile} autoCapitalize="words" /> ) : ( <Text variant="headlineSmall" style={styles.profileName}>{localUser?.name || 'User'}</Text> )}
                  <Text variant="bodyMedium" style={styles.profileEmail}>{localUser?.email}</Text>
                  {profileError && <HelperText type="error" visible={!!profileError}>{profileError}</HelperText>}
                  <View style={styles.profileActions}>
                    {editMode ? ( <> <Button mode="contained" onPress={handleUpdateProfile} loading={isSavingProfile} disabled={isSavingProfile} style={styles.editButton}> Save Profile </Button> <Button mode="outlined" onPress={handleCancelEdit} disabled={isSavingProfile} style={styles.editButton}> Cancel </Button> </> ) : ( <Button mode="outlined" onPress={() => setEditMode(true)} icon="pencil"> Edit Profile </Button> )}
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* --- Subscription Card --- */}
          <Card style={styles.sectionCard}>
              <Card.Title title="Subscription" left={(props) => <MaterialCommunityIcons {...props} name="star-circle" size={24} color={theme.colors.primary} />} />
              <Card.Content>
                <View style={styles.subscriptionDetails}>
                    <View style={styles.subscriptionRow}><Text variant="bodyMedium">Current Plan:</Text><View style={[styles.subscriptionBadge, { backgroundColor: localUser?.subscriptionTier === 'creator_pro' ? '#10b981' : localUser?.subscriptionTier === 'agency_growth' ? '#3b82f6' : '#f97316' }]}><Text style={styles.subscriptionText}>{getSubscriptionName(localUser?.subscriptionTier)}</Text></View></View>
                    <View style={styles.subscriptionRow}><Text variant="bodyMedium">Status:</Text><Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{localUser?.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}</Text></View>
                    <View style={styles.subscriptionRow}><Text variant="bodyMedium">Renews/Expires On:</Text><Text variant="bodyMedium">{formatDate(localUser?.subscriptionEndDate)}</Text></View>
                    <Button mode="contained" icon="crown" style={[styles.upgradeButton, { backgroundColor: localUser?.subscriptionTier === 'free' ? theme.colors.primary : '#10b981' }]} onPress={() => Alert.alert('Subscription', 'Manage subscription functionality coming soon.')}> {localUser?.subscriptionTier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'} </Button>
                </View>
              </Card.Content>
          </Card>

          {/* --- Preferences & Interests Card --- */}
          <Card style={styles.sectionCard}>
            <Card.Title title="Preferences & Interests" left={(props) => <MaterialCommunityIcons {...props} name="tune" size={24} color={theme.colors.primary} />} />
            <Card.Content>
              <Text variant="titleMedium" style={styles.subHeading}>My Interests</Text>
              <HelperText type="info" visible={!editMode && interests.length > 0}>Tap "Edit Profile" to manage interests.</HelperText>
              <View style={styles.chipContainer}>
                {interests.map((interest, index) => ( <Chip key={`${interest}-${index}`} mode="outlined" style={styles.chip} theme={{ colors: { surfaceVariant: editMode ? theme.colors.errorContainer : theme.colors.surfaceVariant } }} /* Indicate deletable */ onClose={editMode ? () => handleDeleteInterest(interest) : undefined} selected={editMode}> {interest} </Chip> ))}
                {interests.length === 0 && !editMode && ( <Text style={styles.placeholderText}>No interests added yet.</Text> )}
              </View>
              {editMode && (
                <>
                  <View style={styles.addInputContainer}>
                    <TextInput mode="outlined" label="Add Interest" value={interestInput} onChangeText={setInterestInput} style={[styles.textInput, styles.addInput]} dense disabled={isSavingProfile || interests.length >= 15} onSubmitEditing={handleAddInterest} maxLength={30} />
                    <Button mode="contained-tonal" icon="plus" onPress={handleAddInterest} disabled={!interestInput.trim() || isSavingProfile || interests.length >= 15} compact style={styles.addButton}> Add </Button>
                  </View>
                  <HelperText type="info" visible={interests.length >= 15}> Max 15 interests. </HelperText>
                </>
              )}
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.subHeading}>Content Preferences</Text>
              <TextInput mode="outlined" label="Preferred News Language" value={preferences?.preferredNewsLanguage || 'en'} onChangeText={handleUpdateLanguage} style={styles.textInput} disabled={!editMode || isSavingProfile} autoCapitalize="none" maxLength={5} />
              <HelperText type="info" visible={editMode}> e.g., en, es, hi, kn </HelperText>
              <Text variant="labelLarge" style={{ marginTop: 10, marginBottom: 5 }}>Preferred News Sources</Text>
               <HelperText type="info" visible={!editMode && (preferences?.newsSources || []).length > 0}>Tap "Edit Profile" to manage sources.</HelperText>
              <View style={styles.chipContainer}>
                {(preferences?.newsSources || []).map((source, index) => ( <Chip key={`${source}-${index}`} mode="outlined" style={styles.chip} theme={{ colors: { surfaceVariant: editMode ? theme.colors.errorContainer : theme.colors.surfaceVariant } }} /* Indicate deletable */ onClose={editMode ? () => handleDeleteNewsSource(source) : undefined} selected={editMode}> {source} </Chip> ))}
                {(preferences?.newsSources?.length === 0 || !preferences?.newsSources) && !editMode && ( <Text style={styles.placeholderText}>No preferred sources added yet.</Text> )}
              </View>
              {editMode && (
                <View style={styles.addInputContainer}>
                  <TextInput mode="outlined" label="Add News Source URL/Name" value={newsSourceInput} onChangeText={setNewsSourceInput} style={[styles.textInput, styles.addInput]} dense disabled={isSavingProfile} onSubmitEditing={handleAddNewsSource} maxLength={100} />
                  <Button mode="contained-tonal" icon="plus" onPress={handleAddNewsSource} disabled={!newsSourceInput.trim() || isSavingProfile} compact style={styles.addButton}> Add </Button>
                </View>
              )}
            </Card.Content>
          </Card>

         {/* --- Security & Account Card --- */}
          <Card style={styles.sectionCard}>
              <Card.Title title="Security & Account" left={(props) => <MaterialCommunityIcons {...props} name="shield-lock-outline" size={24} color={theme.colors.primary} />} />
              <Card.Content>
                  {/* Change Password Item */}
                  <TouchableRipple onPress={() => setIsPasswordSectionVisible(!isPasswordSectionVisible)} disabled={editMode} /* Disable if editing profile */>
                      <List.Item
                          title="Change Password"
                          description={isPasswordSectionVisible ? "Enter details below" : "Update your account password"}
                          left={props => <List.Icon {...props} icon="lock-reset" />}
                          right={props => <List.Icon {...props} icon={isPasswordSectionVisible ? "chevron-up" : "chevron-down"} />}
                          style={editMode ? { opacity: 0.5 } : {}} // Indicate disabled state
                      />
                  </TouchableRipple>
                  {/* Password Change Section (Conditional) */}
                  {isPasswordSectionVisible && (
                      <View style={styles.passwordSection}>
                           <TextInput mode="outlined" label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={secureTextEntryCurrent} style={styles.passwordInput} autoComplete="password" textContentType="password" right={<TextInput.Icon icon={secureTextEntryCurrent ? "eye-off" : "eye"} onPress={() => setSecureTextEntryCurrent(!secureTextEntryCurrent)} />} error={!!passwordError && (passwordError.includes('required') || passwordError.includes('Incorrect'))} disabled={passwordLoading} />
                           <TextInput mode="outlined" label="New Password (min 8 chars)" value={newPassword} onChangeText={setNewPassword} secureTextEntry={secureTextEntryNew} style={styles.passwordInput} autoComplete="password-new" textContentType="newPassword" right={<TextInput.Icon icon={secureTextEntryNew ? "eye-off" : "eye"} onPress={() => setSecureTextEntryNew(!secureTextEntryNew)} />} error={!!passwordError && (passwordError.includes('required') || passwordError.includes('match') || passwordError.includes('long') || passwordError.includes('different'))} disabled={passwordLoading} />
                           <TextInput mode="outlined" label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={secureTextEntryConfirm} style={styles.passwordInput} autoComplete="password-new" textContentType="newPassword" right={<TextInput.Icon icon={secureTextEntryConfirm ? "eye-off" : "eye"} onPress={() => setSecureTextEntryConfirm(!secureTextEntryConfirm)} />} error={!!passwordError && (passwordError.includes('required') || passwordError.includes('match'))} disabled={passwordLoading} />
                           {passwordError && ( <HelperText type="error" visible={!!passwordError} style={{ marginBottom: 8 }}> {passwordError} </HelperText> )}
                           <Button mode="contained" onPress={handlePasswordUpdate} loading={passwordLoading} disabled={passwordLoading} style={{ marginTop: 8 }}> Update Password </Button>
                           <Button mode="text" onPress={() => { setIsPasswordSectionVisible(false); setPasswordError(null); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} disabled={passwordLoading} style={{ marginTop: 4 }}> Cancel </Button>
                      </View>
                  )}
                  <Divider style={styles.divider} />
                  
              </Card.Content>
          </Card>

          {/* --- Logout Button --- */}
          <Button
              mode="outlined"
              onPress={handleLogout} // Uses confirmation dialog now
              style={styles.logoutButton}
              contentStyle={styles.logoutButtonContent}
              icon="logout"
              textColor={theme.colors.error}
              disabled={isSavingProfile || passwordLoading} // Disable while saving anything
            > Log Out
          </Button>

        </ScrollView>

        {/* --- Snackbar for Feedback --- */}
        <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={Snackbar.DURATION_SHORT} style={{ marginBottom: 80 }}>
             <Text style={{ color: theme.colors.inverseOnSurface /* Correct color for snackbar */ }}>{snackbarMessage}</Text>
        </Snackbar>
      </SafeAreaView>
    </Portal.Host>
  );
};

// Styles Definition is now inside the component scope

export default AccountSettingsScreen;