// src/services/dashboardService.ts
import apiClient from './apiClient';

// Define interface for scheduled content
export interface ScheduledContent {
  _id: string;
  scheduledDate: string;
  publishingPlatform: string;
  status: string;
  ideaId: {
    _id: string;
    title: string;
  } | null;
}

// Define interface for saved idea
export interface SavedIdea {
  _id: string;
  title: string;
  angle: string;
  tags: string[];
}

// Get upcoming scheduled content
export const getUpcomingScheduledContent = async (limit = 3): Promise<{ data: ScheduledContent[] }> => {
  try {
    // Get today's date in ISO format
    const today = new Date().toISOString();
    
    // Query for scheduled items from today onwards, sorted by date, limited
    const response = await apiClient.get(`/calendar?startDate=${today}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching upcoming content:', error);
    throw error;
  }
};

// Get recently saved ideas
export const getRecentIdeas = async (limit = 3): Promise<{ data: SavedIdea[] }> => {
  try {
    const response = await apiClient.get(`/ideas?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent ideas:', error);
    throw error;
  }
};