// src/navigation/types.ts
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
  
export type AppTabParamList = {
  Dashboard: undefined;
  Generate: undefined;
  SavedItems: undefined;
  Calendar: undefined;
  Profile: undefined;
  Scripts: undefined;
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