// src/screens/app/TrendsScreen.tsx
import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    Linking,
    Platform,
    Keyboard,
    Alert // Make sure Alert is imported
} from 'react-native';
import {
    Text,
    Button,
    TextInput,
    HelperText,
    useTheme,
    ActivityIndicator,
    Card,
    IconButton,
    Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore'; // Adjust path if needed
import {
    queryTrendsApi,
    saveSearchResultAsInsightApi,
    SearchResultItem,
    Insight,
    SaveInsightFromBodyInput,
    TrendsQueryResponse // Import if needed for explicit typing
} from '../../services/apiClient'; // Adjust path if needed
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // Ensure installed & linked

export default function TrendsScreen() {
    const theme = useTheme();
    const token = useAuthStore((state) => state.token);

    // State for search input and results
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    // Store the query that generated the current list of results, used when saving
    const [originalQueryForResults, setOriginalQueryForResults] = useState('');
    const [loading, setLoading] = useState(false); // Loading state for search query
    const [error, setError] = useState<string | null>(null); // Error message for search query

    // State specifically for the insight saving process
    // Key is the index of the result item in the 'results' array
    const [savingStatus, setSavingStatus] = useState<{ [key: number]: 'idle' | 'saving' | 'saved' | 'error' }>({});
    const [saveError, setSaveError] = useState<string | null>(null); // Stores specific save error message
    const [snackbarVisible, setSnackbarVisible] = useState(false); // Controls snackbar visibility
    const [snackbarMessage, setSnackbarMessage] = useState(''); // Message shown in snackbar

    // --- Handler for initiating a search ---
    const handleSearch = async () => {
        // Basic validation
        if (!token) { setError("Authentication needed."); return; }
        if (searchQuery.trim() === '') { setError("Please enter a search query."); return; }

        Keyboard.dismiss(); // Close keyboard when search starts
        setLoading(true);
        setError(null); // Clear previous search errors
        setSaveError(null); // Clear previous save errors
        setResults([]); // Clear previous results
        setSavingStatus({}); // Reset saving status for new results
        setOriginalQueryForResults(searchQuery); // Store the query term being used

        // --- Corrected try...catch block for handleSearch ---
        try {
            console.log("Sending data to query API:", { query: searchQuery, saveAsInsight: false });
            // Explicitly type the response based on the corrected interface
            const response: TrendsQueryResponse = await queryTrendsApi(searchQuery, false);
            console.log("Received API Response:", response);

            // Check success flag and if response.data IS the array
            if (response.success && Array.isArray(response.data)) {
                setResults(response.data || []); // Get results DIRECTLY from response.data
                console.log("Setting results:", response.data);
            } else {
                // Handle cases where success might be true but data isn't an array,
                // or success is false (error handled by interceptor/backend but check message)
                console.error("API response format unexpected or indicates failure:", response);
                setError(response.message?.includes('limit') ? response.message : "Failed to fetch trends or unexpected format.");
            }
        } catch (err: any) {
            console.error("Trends search catch block:", err);
            // Handle errors, especially usage limit errors (429) or network errors
            // The interceptor might have already processed the error object
            setError(err.message?.includes('limit') ? err.message : (err.message || "An error occurred during search."));
        } finally {
            setLoading(false); // Ensure loading indicator stops
        }
        // --- End Corrected Block ---
    };

    // --- Handler for saving a specific search result as an Insight ---
    const handleSaveInsight = useCallback(async (resultToSave: SearchResultItem, index: number) => {
         if (!token) {
             setSaveError("Authentication error."); // Set specific save error
             setSnackbarMessage("Authentication error.");
             setSnackbarVisible(true);
             return;
         }
         // Prevent multiple clicks if already saving or saved
         if (savingStatus[index] === 'saving' || savingStatus[index] === 'saved') return;

         setSavingStatus(prev => ({ ...prev, [index]: 'saving' })); // Set status to 'saving' for this item
         setSaveError(null); // Clear previous save errors

         // Find the index in the current results array just to be absolutely sure
         // (though using the mapped index should be fine)
         const originalIndex = results.findIndex(r => r.link === resultToSave.link && r.title === resultToSave.title);
         if (originalIndex === -1) {
            console.error("Save Error: Could not find original index for item:", resultToSave.title);
            setSavingStatus(prev => ({ ...prev, [index]: 'error' }));
            const message = "Error: Could not identify result to save.";
            setSaveError(message);
            setSnackbarMessage(message);
            setSnackbarVisible(true);
            return;
         }

         // Prepare data for the dedicated save endpoint
         const saveData: SaveInsightFromBodyInput = {
             resultIndex: originalIndex,
             query: originalQueryForResults, // Pass the query that generated these results
             searchResults: results // Pass the full list of results (backend expects this)
         };

         try {
            // Call the API to save this specific search result
            const response = await saveSearchResultAsInsightApi(saveData); // Token added by interceptor
            if (response.success && response.data) {
                setSavingStatus(prev => ({ ...prev, [index]: 'saved' })); // Update status to 'saved'
                setSnackbarMessage(`Insight Saved: "${response.data.title.substring(0, 30)}..."`);
            } else {
                // Throw error if API call was technically successful but business logic failed
                throw new Error(response.message || "Failed to save insight");
            }
         } catch(err: any) {
             console.error("handleSaveInsight catch block error:", err);
             const message = err.message || "Could not save insight";
             setSavingStatus(prev => ({ ...prev, [index]: 'error' })); // Set status to 'error'
             setSaveError(message); // Store the error message specifically for saving
             setSnackbarMessage(message); // Display error in snackbar
         } finally {
             setSnackbarVisible(true); // Show snackbar message (success or error)
             // We keep the status as 'saved' or 'error' to prevent immediate re-saving attempts.
             // Could add logic to reset 'error' status back to 'idle' on snackbar dismiss if desired.
         }
    }, [token, results, savingStatus, originalQueryForResults]); // Dependencies for useCallback

    // --- Handler for opening links in browser ---
    const openLink = (url: string) => {
        if (!url) return;
        Linking.openURL(url).catch(err => {
             console.error("Failed to open URL:", err);
             Alert.alert("Error", "Could not open the link.");
        });
    };

    // --- Render Functions ---

    // Header Component (Search Bar) - Memoized with useCallback
    const renderListHeader = useCallback(() => (
         <View style={styles.searchContainer}>
                <TextInput
                    label="Search trends / news..."
                    mode="outlined"
                    value={searchQuery}
                    onChangeText={setSearchQuery} // Update state directly
                    style={styles.searchInput}
                    onSubmitEditing={handleSearch} // Allow submitting via keyboard
                    disabled={loading} // Disable input while main search is loading
                    dense // Make input slightly smaller
                />
                <Button
                    mode="contained"
                    onPress={handleSearch} // Trigger search on press
                    loading={loading && results.length === 0} // Show spinner only on initial load
                    disabled={loading || !searchQuery.trim()} // Disable if loading or query empty
                    icon="magnify"
                    style={styles.searchButton}
                    compact // Make button slightly smaller
                >
                    Search
                </Button>
            </View>
    ), [searchQuery, loading, handleSearch]); // Dependencies for useCallback

    // Component to render individual search result card
    const renderResultItem = ({ item, index }: { item: SearchResultItem; index: number }) => {
        const saveStatus = savingStatus[index] || 'idle'; // Default to 'idle'
        // Define icons and colors based on save status
        const iconMap = { saving: "progress-clock", saved: "check-circle", error: "alert-circle-outline", idle: "bookmark-plus-outline" };
        const iconColorMap = { saving: theme.colors.backdrop, saved: theme.colors.tertiary, error: theme.colors.error, idle: theme.colors.primary };

        return (
            <Card style={styles.card}>
                <Card.Content>
                    {/* Make title pressable */}
                    <Text variant="titleMedium" style={{ color: theme.colors.primary }} onPress={() => openLink(item.link)}>
                        {item.title}
                    </Text>
                    {/* Make display link pressable */}
                    <Text variant="bodySmall" style={styles.linkText} onPress={() => openLink(item.link)}>
                        {item.displayLink}
                    </Text>
                    {/* Snippet */}
                    <Text variant="bodyMedium" style={styles.snippetText}>{item.snippet}</Text>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                     {/* Save Button/Icon */}
                     <IconButton
                        icon={iconMap[saveStatus]}
                        iconColor={iconColorMap[saveStatus]}
                        size={24}
                        // Disable if currently saving or already saved successfully
                        disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                        // Call handleSaveInsight with the item and its original index
                        onPress={() => handleSaveInsight(item, index)}
                    />
                    {/* Visit Link Button */}
                    <Button mode="text" onPress={() => openLink(item.link)} compact>
                        Visit Link
                    </Button>
                     {/* Placeholder for future action */}
                     {/* <Button mode="text" compact onPress={() => console.log("Gen Ideas for:", item.title)}>+ Ideas</Button> */}
                </Card.Actions>
            </Card>
        );
    };

    // Component to render when list is empty or loading/error
     const renderEmptyComponent = () => {
         // Show loading indicator if loading AND no results yet shown
         if (loading && results.length === 0) return <ActivityIndicator style={styles.loadingIndicator} size="large" />;
         // Show search error if one occurred
         if (error) return <HelperText type="error" visible={!!error} style={styles.errorText}>{error}</HelperText>;
         // Otherwise, show the initial prompt message
         return (
             <View style={styles.emptyContainer}>
                   <MaterialCommunityIcons name="compass-outline" size={64} color={theme.colors.backdrop} />
                   <Text style={styles.emptyText}>Enter a query above to search for trends or news.</Text>
                   <Text style={styles.emptySubText}>e.g., "AI video tools", "Zomato news", "latest fashion trends India"</Text>
             </View>
         );
     };

    // --- Main Screen Return ---
    return (
        <SafeAreaView style={styles.container}>
            {/* Header Title */}
            <View style={styles.headerContainer}>
                <Text variant="headlineMedium" style={styles.pageTitle}>Explore Trends & News</Text>
            </View>

            {/* Use FlatList for results */}
            <FlatList
                data={results}
                renderItem={renderResultItem}
                // Use link as part of key for better stability if results could reorder (unlikely here)
                keyExtractor={(item, index) => item.link + index}
                ListHeaderComponent={renderListHeader} // Search bar is the header
                ListEmptyComponent={renderEmptyComponent} // Handles loading/error/initial states
                contentContainerStyle={styles.listContent} // Padding for the list itself
                keyboardShouldPersistTaps="handled" // Allows taps on results while keyboard is up
                // Optionally add pull-to-refresh if needed later
            />

            {/* Snackbar for save feedback */}
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)} // Allow dismissing
                duration={3000} // Auto-dismiss after 3 seconds
                // Style differently based on whether it's a save error or success
                style={saveError ? { backgroundColor: theme.colors.errorContainer } : {}}
                theme={saveError ? { colors: { inverseSurface: theme.colors.onErrorContainer }} : {}}
                action={{
                    label: 'Dismiss',
                    onPress: () => { setSnackbarVisible(false); },
                  }}
            >
                {snackbarMessage}
            </Snackbar>
        </SafeAreaView>
    );
}

// --- Styles --- (Keep styles as defined previously)
const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 16 : 8, paddingBottom: 8 },
    pageTitle: { fontWeight: 'bold', textAlign: 'center' },
    searchContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', marginBottom: 8 }, // Added horiz padding back
    searchInput: { flex: 1, marginRight: 8 },
    searchButton: { },
    errorText: { textAlign: 'center', margin: 16, fontSize: 14, paddingBottom: 10 }, // Added padding bottom
    loadingIndicator: { marginTop: 50 },
    emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 30 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#6B7280', textAlign: 'center' },
    emptySubText: { marginTop: 8, fontSize: 13, color: '#9CA3AF', textAlign: 'center'},
    listContent: { paddingHorizontal: 16, paddingBottom: 16 }, // Horizontal padding for list items
    card: { marginVertical: 8, elevation: 1 },
    linkText: { 
        textDecorationLine: 'underline', // Add underline to links
        fontSize: 12, marginTop: 2, marginBottom: 6 },
    snippetText: { color: '#4B5563', lineHeight: 18 },
    cardActions: { justifyContent: 'space-between', paddingRight: 8 } // Align actions and add padding
});