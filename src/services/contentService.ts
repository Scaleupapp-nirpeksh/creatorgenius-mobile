// src/services/contentService.ts
import apiClient from './apiClient';

export const generateContentIdeas = async (data: any): Promise<any> => {
  try {
    const response = await apiClient.post('/content/ideation', data);
    return response.data;
  } catch (error) {
    console.error('Error generating content ideas:', error);
    throw error;
  }
};
