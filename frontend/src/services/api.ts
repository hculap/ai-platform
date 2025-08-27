import axios from 'axios';
import { BusinessProfile, AnalysisResult } from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Functions
export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  try {
    const response = await api.post('/agents/business-concierge/tools/analyze-website/call', {
      input: { url }
    });

    if (response.data.status === 'completed' && response.data.data) {
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Analysis failed'
      };
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    };
  }
};

export const createBusinessProfile = async (profileData: BusinessProfile): Promise<{ success: boolean; error?: string }> => {
  try {
    // This would be implemented when the backend endpoint is available
    console.log('Creating business profile:', profileData);
    return { success: true };
  } catch (error) {
    console.error('Profile creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Profile creation failed'
    };
  }
};

export default api;
