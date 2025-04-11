// src/services/scriptService.ts
import apiClient from './apiClient';
import { Script, ScriptSection } from './apiClient';

export interface ScriptGenerationParams {
  platform?: string;
  style?: 'conversational' | 'educational' | 'storytelling';
  targetDuration?: 'short' | 'medium' | 'long';
  focusKeywords?: string[];
  additionalInstructions?: string;
}

export interface ScriptTransformParams {
  targetPlatforms: string[];
}

// Generate a script from a saved idea
export const generateScript = async (
  ideaId: string, 
  params: ScriptGenerationParams
): Promise<{ data: Script }> => {
  try {
    const response = await apiClient.post(`/scripts/generate/${ideaId}`, params);
    return response.data;
  } catch (error) {
    console.error(`Error generating script for idea ${ideaId}:`, error);
    throw error;
  }
};

// Save a script
export const saveScript = async (scriptData: Partial<Script>): Promise<{ data: Script }> => {
  try {
    const response = await apiClient.post('/scripts', scriptData);
    return response.data;
  } catch (error) {
    console.error('Error saving script:', error);
    throw error;
  }
};

// Get all scripts for the current user
export const getUserScripts = async (): Promise<{ data: Script[], count: number }> => {
  try {
    const response = await apiClient.get('/scripts');
    return response.data;
  } catch (error) {
    console.error('Error fetching scripts:', error);
    throw error;
  }
};

// Get a specific script by ID
export const getScriptById = async (scriptId: string): Promise<{ data: Script }> => {
  try {
    const response = await apiClient.get(`/scripts/${scriptId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching script ${scriptId}:`, error);
    throw error;
  }
};

// Update a script
export const updateScript = async (
  scriptId: string, 
  updates: Partial<Script>
): Promise<{ data: Script }> => {
  try {
    const response = await apiClient.put(`/scripts/${scriptId}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating script ${scriptId}:`, error);
    throw error;
  }
};

// Delete a script
export const deleteScript = async (scriptId: string): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await apiClient.delete(`/scripts/${scriptId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting script ${scriptId}:`, error);
    throw error;
  }
};

// Transform a script to different platforms
export const transformScript = async (
  scriptId: string, 
  params: ScriptTransformParams
): Promise<{ transformedScripts: any[] }> => {
  try {
    const response = await apiClient.post(`/scripts/${scriptId}/transform`, params);
    return response.data;
  } catch (error) {
    console.error(`Error transforming script ${scriptId}:`, error);
    throw error;
  }
};

// Save a transformed script
export const saveTransformedScript = async (
  scriptData: Partial<Script> & { originalScriptId: string }
): Promise<{ data: Script }> => {
  try {
    const response = await apiClient.post('/scripts/transformed', scriptData);
    return response.data;
  } catch (error) {
    console.error('Error saving transformed script:', error);
    throw error;
  }
};

// Get transformed versions of a script
export const getTransformedScripts = async (
  scriptId: string
): Promise<{ data: Script[], count: number }> => {
  try {
    const response = await apiClient.get(`/scripts/${scriptId}/transformed`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching transformed scripts for ${scriptId}:`, error);
    throw error;
  }
};


export { Script, ScriptSection } from './apiClient';