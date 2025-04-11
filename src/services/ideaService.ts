// src/services/ideaService.ts
import apiClient from './apiClient';

export interface SavedIdea {
  _id: string;
  title: string;
  angle: string;
  tags: string[];
  hook?: string;
  structure_points?: string[];
  platform_suitability?: 'High' | 'Medium' | 'Low' | null;
  intendedEmotion?: string;
  savedAt: string;
}

export interface IdeaRefinement {
  _id: string;
  originalIdeaId: string;
  refinementType: string;
  result: any;
  createdAt: string;
}

// Get all saved ideas with optional filters
export const getSavedIdeas = async (filters?: { tag?: string; search?: string }): Promise<{ data: SavedIdea[], count: number }> => {
  try {
    let queryParams = '';
    if (filters?.tag) queryParams += `?tag=${encodeURIComponent(filters.tag)}`;
    if (filters?.search) {
      queryParams += queryParams ? `&search=${encodeURIComponent(filters.search)}` : `?search=${encodeURIComponent(filters.search)}`;
    }
    
    const response = await apiClient.get(`/ideas${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching saved ideas:', error);
    throw error;
  }
};

// Get a specific saved idea by ID
export const getSavedIdea = async (ideaId: string): Promise<{ data: SavedIdea }> => {
  try {
    const response = await apiClient.get(`/ideas/${ideaId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching saved idea ${ideaId}:`, error);
    throw error;
  }
};

// Update a saved idea
export const updateIdea = async (ideaId: string, updateData: Partial<SavedIdea>): Promise<{ data: SavedIdea }> => {
  try {
    const response = await apiClient.put(`/ideas/${ideaId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating idea ${ideaId}:`, error);
    throw error;
  }
};

// Delete a saved idea
export const deleteIdea = async (ideaId: string): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await apiClient.delete(`/ideas/${ideaId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting idea ${ideaId}:`, error);
    throw error;
  }
};

// Get refinements for an idea
export const getRefinementsForIdea = async (ideaId: string): Promise<{ data: IdeaRefinement[] }> => {
  try {
    const response = await apiClient.get(`/ideas/${ideaId}/refinements`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching refinements for idea ${ideaId}:`, error);
    throw error;
  }
};

// Generate a refinement for an idea
export const refineIdea = async (
  ideaId: string, 
  refinementType: string,
  additionalInstructions?: string
): Promise<{ data: any }> => {
  try {
    const response = await apiClient.post(`/ideas/${ideaId}/refine`, {
      refinementType,
      additionalInstructions
    });
    return response.data;
  } catch (error) {
    console.error(`Error refining idea ${ideaId}:`, error);
    throw error;
  }
};