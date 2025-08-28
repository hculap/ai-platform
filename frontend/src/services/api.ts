import axios from 'axios';
import { BusinessProfile, AnalysisResult, AuthResponse } from '../types';

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

// User Authentication
export const registerUser = async (email: string, password: string): Promise<{ success: boolean; data?: AuthResponse; error?: string }> => {
  try {
    const response = await api.post('/auth/register', {
      email,
      password
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Registration failed'
    };
  }
};

export const loginUser = async (email: string, password: string): Promise<{ success: boolean; data?: AuthResponse; error?: string }> => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Login failed'
    };
  }
};

export const createBusinessProfile = async (profileData: BusinessProfile, authToken?: string): Promise<{ success: boolean; profileId?: string; error?: string }> => {
  try {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Map frontend BusinessProfile to backend expected format
    const backendProfileData = {
      website_url: profileData.website_url,
      name: profileData.company_name,
      offer_description: profileData.offer,
      target_customer: profileData.target_customer,
      problem_solved: profileData.problems,
      customer_desires: profileData.desires,
      brand_tone: profileData.tone,
      communication_language: profileData.language
    };

    const response = await api.post('/business-profiles', backendProfileData, { headers });

    return {
      success: true,
      profileId: response.data.id
    };
  } catch (error: any) {
    console.error('Profile creation error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Profile creation failed'
    };
  }
};

export default api;
