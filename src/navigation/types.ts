// src/navigation/types.ts (updated)
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
};

export type SavedIdeasStackParamList = {
  SavedIdeasList: undefined;
  IdeaDetail: { ideaId: string };
  RefineIdea: { idea: any };
};

// Update CalendarStackParamList in types.ts
export type CalendarStackParamList = {
  CalendarView: undefined;
  ScheduleDetail: { id: string };
  AddSchedule: { ideaId?: string; ideaTitle?: string };
  // Add EditSchedule when you create it
};

export type GenerateStackParamList = {
  GenerateIdeas: undefined;
};

export type GenerateStackParamList = {
  GenerateIdeas: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Generate: undefined;
  SavedItems: undefined;
  Calendar: undefined;
  Profile: undefined;
};
