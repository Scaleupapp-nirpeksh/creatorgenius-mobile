// src/services/apiClient.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

const AUTH_TOKEN_KEY = 'creatorgenius_authToken'; // Make sure this matches what's in authStore.ts

// Define backend API base URL with platform-specific handling
let API_BASE_URL = 'http://creator-genius-env-2.eba-8xmj6etz.ap-south-1.elasticbeanstalk.com/api';

/*
// Use different URLs for development environments
if (__DEV__) {
  if (Platform.OS === 'android') {
    API_BASE_URL = 'http://10.0.2.2:5001/api';
  } else if (Platform.OS === 'ios') {
    API_BASE_URL = 'http://192.168.68.109:5001/api';
  }
}
*/
console.log(`API Base URL: ${API_BASE_URL}`);

// --- Create Axios Instance ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// --- Enhanced Request Interceptor ---
apiClient.interceptors.request.use(
  async (config) => {
    try {
      console.log(`🚀 REQUEST: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        params: config.params,
        data: config.data ? JSON.stringify(config.data).substring(0, 500) : null
      });
      
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token attached to request');
      } else {
        console.log('No token available for request');
      }
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// --- Enhanced Response Interceptor ---
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ RESPONSE: ${response.status} ${response.config.url}`, {
      data: response.data ? JSON.stringify(response.data).substring(0, 500) : null
    });
    return response;
  },
  async (error) => {
    // Log detailed error information
    console.error(`❌ ERROR:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status || 'No response',
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data ? JSON.stringify(error.response.data).substring(0, 500) : null,
      timeout: error.code === 'ECONNABORTED' ? 'Request timed out' : null
    });
    
    // Handle 401 errors as before
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      console.warn('Received 401 Unauthorized - Logging out via interceptor.');
      if (originalRequest) originalRequest._retry = true;
      try {
        await useAuthStore.getState().logout();
        console.log('Auto-Logout successful.');
      } catch (logoutError) {
        console.error('Error during auto-logout:', logoutError);
      }
    }
    
    // Return a structured error for consistent handling in catch blocks
    return Promise.reject(error.response?.data || {
      success: false,
      message: error.message || 'Network error or unexpected issue occurred.',
      isNetworkError: !error.response,
      status: error.response?.status,
      isTimeout: error.code === 'ECONNABORTED'
    });
  }
);


// ===============================================
// --- TYPE DEFINITIONS ---
// ===============================================

// --- Generic API Response ---
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string; // For login/register
  count?: number; // For list endpoints
  total?: number; // For paginated endpoints
  pagination?: { currentPage?: number; totalPages?: number; [key: string]: any; };
  // Allow other potential fields
  [key: string]: any;
}

// --- User & Auth ---
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscriptionTier?: string;
  subscriptionStatus?: string; // Add if not present
  subscriptionEndDate?: string; // Add if not present
  profilePictureUrl?: string;
  interests?: string[];
  preferences?: { newsSources?: string[]; preferredNewsLanguage?: string; [key: string]: any; };
  usage?: { [key: string]: any; }; // Be more specific if needed
  [key: string]: any; // Allow other user fields
}
export interface LoginCredentials { email: string; password: string; }
export interface RegisterUserData { name: string; email: string; password: string; check:boolean }

// --- Ideas ---
export interface Idea {
    _id?: string; // Present for saved ideas
    title: string;
    angle: string;
    tags: string[];
    hook?: string;
    structure_points?: string[];
    platform_suitability?: 'High' | 'Medium' | 'Low' | null;
    intendedEmotion?: string;
    // Frontend specific temporary index (optional)
    tempIndex?: number;
    // DB fields (optional on frontend types unless needed)
    userId?: string;
    savedAt?: string;
}
// Input for generating ideas
export interface IdeationInput {
    topic?: string; keywords?: string[]; platform?: string; language?: string;
    niche?: string; tone?: string; targetAudienceDetails?: string; numberOfIdeas?: number;
    emotionalGoal?: string; keyTakeaway?: string; targetAudiencePainPoint?: string;
}
// Response from generating ideas
export interface IdeationResponse extends ApiResponse<{ data: Idea[] }> {} // Backend returns ideas in data.data
// Data for saving a new idea
export type IdeaSaveData = Omit<Idea, '_id' | 'savedAt' | 'userId' | 'tempIndex'>;

// --- Refinements ---
// Input for refining an idea
export interface RefineInput {
    refinementType: 'titles' | 'script_outline' | 'elaborate_angle' | 'hook_ideas' | string; // Allow for future types
    additionalInstructions?: string;
}
// Response from refining an idea (data structure varies)
export interface RefineResponse extends ApiResponse<{
    refinementType: string;
    originalIdeaId: string;
    savedRefinementId?: string | null; // ID if saved successfully
    data: any; // The actual refinement data { titles: [], or outline: [], etc.}
}> {}

// --- Scripts ---
export interface ScriptSection { section: string; content: string; visualDirection?: string; duration?: string; }
export interface Script {
    _id: string; userId: string; ideaId?: { _id: string; title: string; angle?: string; } | string | null;
    originalScriptId?: string | null; title: string; platform: string; targetDuration?: string;
    intro: string; body: ScriptSection[]; outro: string; callToAction: string;
    bRollSuggestions?: string[]; tags?: string[]; isTransformed?: boolean;
    createdAt: string; lastModified: string;
}

// --- Trends & Search ---
export interface SearchResultItem { title: string; link: string; snippet: string; displayLink: string; }
// Corrected Response type for Trends Query
export interface TrendsQueryResponse {
    success: boolean;
    message?: string;
    query: string;
    count: number;
    data: SearchResultItem[]; // Array is directly under 'data' key now
    savedInsight?: Insight;
    [key: string]: any;
}
// Input type for saving a specific search result
export interface SaveInsightFromBodyInput { resultIndex: number; query: string; searchResults: SearchResultItem[]; }

// --- Insights ---
export interface Insight {
    _id: string; userId: string; type: string; title: string; content: any;
    source?: { url?: string; name?: string; query?: string };
    tags?: string[]; notes?: string; createdAt?: string; updatedAt?: string;
}
// Input type for saving SEO report as Insight
export interface SaveSeoReportInput {
    title: string; // Can be optional if backend handles default
    seoData: SeoAnalysisResult; // The result from the SEO analysis
    sourceQuery?: string;
    notes?: string;
    tags?: string[];
}

// --- SEO ---
// Input for SEO analysis
export interface SeoInput {
    targetPlatform: string; language?: string; topic?: string;
    currentTitle?: string; currentDescription?: string; keywords?: string[];
    contentText?: string;
}
// Expected result data structure from SEO analysis
export interface SeoAnalysisResult {
    suggestedKeywords?: string[]; optimizedTitles?: string[];
    optimizedDescription?: string; suggestedHashtags?: string[];
    contentFeedback?: string; suggestedSaveTitle?: string;
}
// Full response from SEO analysis endpoint
export interface SeoAnalysisResponse extends ApiResponse<SeoAnalysisResult> {}


// ===============================================
// --- API FUNCTION IMPLEMENTATIONS ---
// ===============================================

// --- Auth ---
export const registerUserApi = async (userData: RegisterUserData): Promise<ApiResponse<{ token: string }>> => {
  try { return (await apiClient.post('/auth/register', userData)).data; }
  catch (error: any) { console.error('API Register Error:', error); throw error; }
};
export const loginUserApi = async (credentials: LoginCredentials): Promise<ApiResponse<{ token: string }>> => {
  try { return (await apiClient.post('/auth/login', credentials)).data; }
  catch (error: any) { console.error('API Login Error:', error); throw error; }
};
export const getCurrentUserApi = async (): Promise<User> => { // Returns User directly on success
  try {
    const response = await apiClient.get<ApiResponse<User>>('/users/me');
    if (!response.data.success || !response.data.data) throw new Error(response.data.message || 'Failed to get user data');
    return response.data.data;
  } catch (error: any) { console.error('API Get Current User Error:', error); throw error; }
};
// Add profile update, password update etc. API calls here later if needed directly


// --- Content Ideation ---
export const generateIdeasApi = async (input: IdeationInput): Promise<IdeationResponse> => {
  // Token added by interceptor
  try { return (await apiClient.post('/content/ideation', input)).data; } // Backend returns { success, message, data: { ideas: [] } } - adjust if needed based on backend code
  catch (error: any) { console.error('API Generate Ideas Error:', error); throw error; }
};
// Corrected: Backend returns ideas directly in 'data', not 'data.data' based on controller code
export const generateTrendIdeasApi = async (input: { trendDescription: string; [key: string]: any }): Promise<ApiResponse<Idea[]>> => {
    // Token added by interceptor
    try { return (await apiClient.post('/content/trend-ideation', input)).data; } // Expects { success, message, data: [...] }
    catch (error: any) { console.error('API Generate Trend Ideas Error:', error); throw error; }
};


// --- Saved Ideas ---
export const saveIdeaApi = async (ideaData: IdeaSaveData): Promise<ApiResponse<Idea>> => {
  try { return (await apiClient.post('/ideas', ideaData)).data; }
  catch (error: any) { console.error('API Save Idea Error:', error); throw error; }
};
export const getSavedIdeasApi = async (): Promise<ApiResponse<Idea[]>> => {
  try { return (await apiClient.get('/ideas')).data; }
  catch (error: any) { console.error('API Get Saved Ideas Error:', error); throw error; }
};
export const deleteIdeaApi = async (ideaId: string): Promise<ApiResponse<{}>> => {
  try {
    if (!ideaId) throw new Error("Idea ID required for deletion.");
    return (await apiClient.delete(`/ideas/${ideaId}`)).data;
   } catch (error: any) { console.error('API Delete Idea Error:', error); throw error; }
};

// --- Idea Refinements ---
export const refineIdeaApi = async (ideaId: string, input: RefineInput): Promise<RefineResponse> => {
    try {
        if (!ideaId) throw new Error("Original Idea ID required for refinement.");
        return (await apiClient.post(`/ideas/${ideaId}/refine`, input)).data;
    } catch (error: any) { console.error('API Refine Idea Error:', error); throw error; }
};
export const getRefinementsForIdeaApi = async (ideaId: string): Promise<ApiResponse<any[]>> => { // Replace 'any' with Refinement type if defined
     try {
        if (!ideaId) throw new Error("Original Idea ID required.");
        return (await apiClient.get(`/ideas/${ideaId}/refinements`)).data;
    } catch (error: any) { console.error('API Get Refinements Error:', error); throw error; }
};


// --- Trends Query & Saving ---
export const queryTrendsApi = async (query: string, saveAsInsight: boolean = false): Promise<TrendsQueryResponse> => {
  try { return (await apiClient.post('/trends/query', { query, saveAsInsight })).data; }
  catch (error: any) { console.error('API Query Trends Error:', error); throw error; }
};
export const saveSearchResultAsInsightApi = async (data: SaveInsightFromBodyInput): Promise<ApiResponse<Insight>> => {
   try { return (await apiClient.post('/trends/save-insight', data)).data; }
   catch (error: any) { console.error('API Save Search Result Error:', error); throw error; }
};


// --- Insights CRUD ---
export const createInsightApi = async (insightData: Omit<Insight, '_id'|'userId'|'createdAt'|'updatedAt'>): Promise<ApiResponse<Insight>> => {
     try { return (await apiClient.post('/insights', insightData)).data; }
     catch (error: any) { console.error('API Create Insight Error:', error); throw error; }
};
export const getInsightsApi = async (params?: { type?: string; search?: string; limit?: number; page?: number }): Promise<ApiResponse<Insight[]>> => {
  try { return (await apiClient.get('/insights', { params })).data; }
  catch (error: any) { console.error('API Get Insights Error:', error); throw error; }
};
export const getInsightByIdApi = async (insightId: string): Promise<ApiResponse<Insight>> => {
    try {
        if (!insightId) throw new Error("Insight ID required.");
        return (await apiClient.get(`/insights/${insightId}`)).data;
    } catch (error: any) { console.error('API Get Insight By ID Error:', error); throw error; }
};
export const updateInsightApi = async (insightId: string, updateData: Partial<Pick<Insight, 'title' | 'tags' | 'notes'>>): Promise<ApiResponse<Insight>> => {
     try {
        if (!insightId) throw new Error("Insight ID required for update.");
        return (await apiClient.put(`/insights/${insightId}`, updateData)).data;
     } catch (error: any) { console.error('API Update Insight Error:', error); throw error; }
};
export const deleteInsightApi = async (insightId: string): Promise<ApiResponse<{}>> => {
     try {
        if (!insightId) throw new Error("Insight ID required for deletion.");
        return (await apiClient.delete(`/insights/${insightId}`)).data;
     } catch (error: any) { console.error('API Delete Insight Error:', error); throw error; }
};
// New endpoint for saving SEO report
export const saveSeoReportAsInsightApi = async (saveData: SaveSeoReportInput): Promise<ApiResponse<Insight>> => {
    try { return (await apiClient.post('/insights/from-seo', saveData)).data; }
    catch (error: any) { console.error('API Save SEO Report Error:', error); throw error; }
};


// --- SEO Analysis ---
export const analyzeContentSeoApi = async (input: SeoInput): Promise<SeoAnalysisResponse> => {
    try { return (await apiClient.post('/seo/analyze', input)).data; }
    catch (error: any) { console.error('API SEO Analysis Error:', error); throw error; }
};

// --- Calendar --- (Assuming backend structure matches service calls)
export const getUpcomingScheduledContent = async (limit = 3): Promise<ApiResponse<any[]>> => { // Replace any with ScheduledContent type
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
    try { return (await apiClient.get(`/calendar?startDate=${today}&limit=${limit}&sort=scheduledDate`)).data; } // Assume backend supports sort
    catch (error) { console.error('Error fetching upcoming content:', error); throw error; }
};
export const getCalendarItemsApi = async (params?: { startDate?: string; endDate?: string; status?: string; platform?: string; priority?: string; limit?: number; page?: number }): Promise<ApiResponse<any[]>> => { // Replace any
    try { return (await apiClient.get('/calendar', { params })).data; }
    catch (error) { console.error('Error fetching calendar items:', error); throw error; }
};
// Add POST, GET/:id, PUT/:id, DELETE/:id for /calendar here


// --- Script CRUD ---
export const getUserScriptsApi = async (params?: { limit?: number; page?: number }): Promise<ApiResponse<Script[]>> => {
  try { return (await apiClient.get('/scripts', { params })).data; }
  catch (error: any) { console.error('API Get User Scripts Error:', error); throw error; }
};
export const getScriptByIdApi = async (scriptId: string): Promise<ApiResponse<Script>> => {
    try {
        if (!scriptId) throw new Error("Script ID required.");
        return (await apiClient.get(`/scripts/${scriptId}`)).data;
    } catch (error: any) { console.error('API Get Script By ID Error:', error); throw error; }
};
export const deleteScriptApi = async (scriptId: string): Promise<ApiResponse<{}>> => {
     try {
        if (!scriptId) throw new Error("Script ID required for deletion.");
        return (await apiClient.delete(`/scripts/${scriptId}`)).data;
     } catch (error: any) { console.error('API Delete Script Error:', error); throw error; }
};
// Add POST for saveScript, PUT for updateScript etc.




// --- User Profile Management ---
export interface UpdateUserProfileData {
    name?: string;
    profilePictureUrl?: string;
    interests?: string[];
    // Ensure preferences structure matches backend/User model
    preferences?: { newsSources?: string[]; preferredNewsLanguage?: string; };
}

export const updateUserProfileApi = async (updateData: UpdateUserProfileData): Promise<ApiResponse<User>> => {
    try {
        // Backend controller filters allowed fields, no need to filter excessively here
        console.log('Updating profile with data:', updateData); // Log data being sent
        const response = await apiClient.put<ApiResponse<User>>('/users/me', updateData);
        console.log('Update profile response:', response.data); // Log response
        return response.data;
    } catch (error: any) {
        console.error('API Update User Profile Error:', error);
        throw error; // Re-throw the structured error from the interceptor
    }
};

export interface UpdatePasswordData {
    currentPassword: string;
    newPassword: string;
}

export const updatePasswordApi = async (passwordData: UpdatePasswordData): Promise<ApiResponse<{}>> => { // No data expected on success
    try {
        console.log('Updating password...'); // Avoid logging passwords themselves
        const response = await apiClient.put<ApiResponse<{}>>('/users/updatepassword', passwordData);
        console.log('Update password response:', response.data); // Log response
        return response.data;
    } catch (error: any) {
        console.error('API Update Password Error:', error);
        // Log specific error message if available
        if (error && typeof error === 'object' && 'message' in error) {
             console.error('Password update failed with message:', error.message);
        }
        throw error; // Re-throw the structured error from the interceptor
    }
};

// Optional: Interface if password confirmation is needed for delete
// export interface DeleteAccountData { currentPassword: string; }

export const deleteMyAccountApi = async (/* data?: DeleteAccountData */): Promise<ApiResponse<{}>> => { // No data expected on success
    try {
        console.log('Attempting account deletion via API...');
        // If password confirmation added: await apiClient.delete('/users/me', { data })
        const response = await apiClient.delete<ApiResponse<{}>>('/users/me');
        console.log('Delete account response:', response.data); // Log response
        return response.data;
    } catch (error: any) {
        console.error('API Delete Account Error:', error);
        throw error; // Re-throw the structured error from the interceptor
    }
};


export interface Feedback {
  _id: string;
  userId: string;
  type: 'query' | 'feedback' | 'issue';
  title: string;
  description: string;
  rating?: number;
  ratingReason?: string;
  tags?: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  // Add additional fields as needed
}

// Get feedback for the logged-in user
export const getUserFeedbackApi = async (): Promise<ApiResponse<Feedback[]>> => {
  try {
    return (await apiClient.get('/feedback')).data;
  } catch (error: any) {
    console.error('API Get User Feedback Error:', error);
    throw error;
  }
};

// Create new feedback (or query/issue)
export const createFeedbackApi = async (feedbackData: {
  type: string;
  title: string;
  description: string;
  rating?: number;
  ratingReason?: string;
  tags?: string[];
}): Promise<ApiResponse<Feedback>> => {
  try {
    return (await apiClient.post('/feedback', feedbackData)).data;
  } catch (error: any) {
    console.error('API Create Feedback Error:', error);
    throw error;
  }
};


export interface UsageFeature {
  current: number;
  limit: number | 'unlimited';
  remaining: number | 'unlimited';
}

export interface UsageData {
  daily: Record<string, UsageFeature>;
  monthly: Record<string, UsageFeature>;
  permanent: Record<string, { 
    limit: number | 'unlimited';
    current?: number;       // Only if you decide to query DB for actual usage
    remaining?: number | 'unlimited';
  }>;
}

export const getUserUsageApi = async (): Promise<ApiResponse<UsageData>> => {
  try {
    const response = await apiClient.get<ApiResponse<UsageData>>('/users/me/usage');
    return response.data;
  } catch (error: any) {
    console.error('API Get User Usage Error:', error);
    throw error;
  }
};

// --- Default export ---
export default apiClient;