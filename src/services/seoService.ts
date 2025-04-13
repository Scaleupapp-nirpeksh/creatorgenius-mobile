// src/services/seoService.ts
import apiClient, { SeoInput, SeoAnalysisResult, SaveSeoReportInput } from './apiClient';

// Analyze content for SEO optimization
export const analyzeSeoContent = async (data: SeoInput): Promise<{ data: SeoAnalysisResult, success: boolean, message?: string }> => {
  try {
    const response = await apiClient.post('/seo/analyze', data);
    return response.data;
  } catch (error) {
    console.error('Error analyzing SEO content:', error);
    throw error;
  }
};

// Save SEO analysis as an insight
export const saveSeoReport = async (data: SaveSeoReportInput): Promise<{ success: boolean, message?: string, data?: any }> => {
  try {
    const response = await apiClient.post('/insights/from-seo', data);
    return response.data;
  } catch (error) {
    console.error('Error saving SEO report:', error);
    throw error;
  }
};

export { SeoAnalysisResult, SeoInput, SaveSeoReportInput } from './apiClient';