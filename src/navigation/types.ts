// src/navigation/types.ts
export type AuthStackParamList = {
    Login: undefined; // No params expected for Login screen
    Register: undefined;
  };
  
  export type AppTabParamList = {
    Dashboard: undefined;
    Generate: undefined; // Placeholder for a central action or screen
    Calendar: undefined;
    Profile: undefined;
    // Add other main tabs here
  };
  
  // Add other ParamLists if using more navigators