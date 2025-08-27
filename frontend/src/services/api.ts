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

// Start background analysis
export const startBackgroundAnalysis = async (url: string): Promise<{ success: boolean; openaiResponseId?: string; error?: string }> => {
  try {
    const response = await api.post('/agents/business-concierge/tools/analyze-website/call', {
      input: { url },
      background: true
    });

    if (response.data.status === 'pending' && response.data.data?.openai_response_id) {
      return {
        success: true,
        openaiResponseId: response.data.data.openai_response_id
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Failed to start analysis'
      };
    }
  } catch (error) {
    console.error('Analysis start error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start analysis'
    };
  }
};

// Check analysis status
export const checkAnalysisStatus = async (openaiResponseId: string): Promise<{ 
  status: 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed' | 'canceled' | 'error'; 
  data?: BusinessProfile; 
  error?: string 
}> => {
  try {
    const response = await api.post('/agents/business-concierge/tools/check-analysis-status/call', {
      input: { openai_response_id: openaiResponseId }
    });

    if (response.data.status === 'completed' && response.data.data) {
      const analysisData = response.data.data;
      
      if (analysisData.status === 'completed' && analysisData.business_profile) {
        return {
          status: 'completed',
          data: analysisData.business_profile
        };
      } else if (analysisData.status === 'pending' || analysisData.status === 'queued' || analysisData.status === 'in_progress') {
        // Still processing - return the OpenAI status directly
        console.log('Analysis Status:', analysisData.status);
        return {
          status: analysisData.status
        };
      } else {
        return {
          status: 'error',
          error: analysisData.error || analysisData.message || 'Unknown status'
        };
      }
    } else if (response.data.error) {
      return {
        status: 'failed',
        error: response.data.error || 'Analysis failed'
      };
    } else {
      return {
        status: 'error',
        error: 'Failed to check status'
      };
    }
  } catch (error) {
    console.error('Status check error:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to check status'
    };
  }
};

// Legacy synchronous analysis (kept for backward compatibility)
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
