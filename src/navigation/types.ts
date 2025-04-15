// src/navigation/types.ts - Updated with SEO types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
  
export type AppTabParamList = {
  Dashboard: undefined;
  Generate: undefined;
  SavedItems: undefined;
  Calendar: undefined;
  Trends: undefined;
  SEO: undefined;
  Scripts: undefined;
  AccountSettings: undefined;
 // Feedback: undefined; // Add this line
};


export type SavedIdeasStackParamList = {
  SavedIdeasList: undefined;
  IdeaDetail: { ideaId: string };
  RefineIdea: { idea: any };
};

export type CalendarStackParamList = {
  CalendarView: undefined;
  ScheduleDetail: { id: string };
  AddSchedule: { ideaId?: string; ideaTitle?: string };
  EditSchedule: { scheduleId: string };
};

export type GenerateStackParamList = {
  GenerateIdeas: undefined;
};

// Add new navigation types for script-related screens
export type ScriptStackParamList = {
  ScriptsList: undefined;
  CreateScript: undefined;
  ScriptDetail: { scriptId: string };
  ScriptPreview: { script: any; ideaId: string };
  EditScript: { scriptId: string };
  TransformScript: { scriptId: string };
};

export type TrendsStackParamList = {
  TrendsQuery: undefined;
  TrendDetail: { trendId: string };
};


export type SeoStackParamList = {
  SeoAnalysis: {
    prefillData?: {
      topic?: string;
      currentTitle?: string;
      currentDescription?: string;
      keywords?: string;
      contentText?: string;
      platform?: string;
    };
    ideaId?: string;
    scriptId?: string;
  };
  SavedSeoInsights: undefined;
  SeoInsightDetail: { insightId: string };
};

