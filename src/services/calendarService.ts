// src/services/calendarService.ts
import apiClient from './apiClient';
import { SavedIdea } from './ideaService';

export interface ScheduledContent {
  _id: string;
  userId: string;
  ideaId: {
    _id: string;
    title: string;
  } | null;
  scheduledDate: string;
  publishingPlatform: string;
  status: 'scheduled' | 'in-progress' | 'posted' | 'delayed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  postingNotes?: string;
  additionalDetails?: string;
  createdAt: string;
  lastModified: string;
}

export interface ScheduleData {
  ideaId: string;
  scheduledDate: string;
  publishingPlatform: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  postingNotes?: string;
  additionalDetails?: string;
}

// Extend ScheduleData to include an optional 'status'
export interface ScheduledUpdateData extends Partial<ScheduleData> {
  status?: 'scheduled' | 'in-progress' | 'posted' | 'delayed';
}

// Get all scheduled content with optional filters
export const getScheduledContent = async (filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  platform?: string;
}): Promise<{ data: ScheduledContent[], count: number }> => {
  try {
    let queryParams = '';
    
    if (filters) {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.platform) params.append('platform', filters.platform);
      
      queryParams = `?${params.toString()}`;
    }
    
    const response = await apiClient.get(`/calendar${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scheduled content:', error);
    throw error;
  }
};

// Get a specific scheduled item
export const getScheduledItem = async (itemId: string): Promise<{ data: ScheduledContent }> => {
  try {
    const response = await apiClient.get(`/calendar/${itemId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching scheduled item ${itemId}:`, error);
    throw error;
  }
};

// Schedule a new item
export const scheduleItem = async (data: ScheduleData): Promise<{ data: ScheduledContent }> => {
  try {
    const response = await apiClient.post('/calendar', data);
    return response.data;
  } catch (error) {
    console.error('Error scheduling item:', error);
    throw error;
  }
};

// Update a scheduled item using the extended update type
export const updateScheduledItem = async (
  itemId: string, 
  data: ScheduledUpdateData
): Promise<{ data: ScheduledContent }> => {
  try {
    const response = await apiClient.put(`/calendar/${itemId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating scheduled item ${itemId}:`, error);
    throw error;
  }
};

// Delete a scheduled item
export const deleteScheduledItem = async (itemId: string): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await apiClient.delete(`/calendar/${itemId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting scheduled item ${itemId}:`, error);
    throw error;
  }
};

// Get available ideas for scheduling
export const getIdeasForScheduling = async (): Promise<{ data: SavedIdea[] }> => {
  try {
    const response = await apiClient.get('/ideas');
    return response.data;
  } catch (error) {
    console.error('Error fetching ideas for scheduling:', error);
    throw error;
  }
};

export { SavedIdea } from './ideaService';