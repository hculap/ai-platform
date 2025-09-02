import axios from 'axios';
import { BusinessProfile, BusinessProfileApi, AnalysisResult, AuthResponse, Offer, Campaign, CampaignGenerationParams, CampaignGenerationResult, CampaignGoal } from '../types';
import { tokenManager } from './tokenManager';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get valid token (auto-refreshes if needed)
      const token = await tokenManager.getValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // If token refresh fails, let the request proceed without auth
      // The response interceptor will handle 401s
      console.warn('Could not get valid token for request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401s automatically
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const newToken = await tokenManager.refreshToken();
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        tokenManager.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

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
    const response = await api.get(`/agents/business-concierge/tools/analyze-website/call?job_id=${openaiResponseId}`);

    if (response.data && response.data.data) {
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



// Dashboard data API functions
export const getAgentsCount = async (authToken: string): Promise<{ success: boolean; data?: number; error?: string }> => {
  try {
    const response = await api.get('/agents', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data.length
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error fetching agents count:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch agents count'
    };
  }
};

export const getBusinessProfilesCount = async (authToken: string): Promise<{ success: boolean; data?: number; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.get('/business-profiles', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data.length
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error fetching business profiles count:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();
      
      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.get('/business-profiles', {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data && retryResponse.data.data) {
            return {
              success: true,
              data: retryResponse.data.data.length
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch business profiles count'
    };
  }
};

export const getInteractionsCount = async (authToken: string): Promise<{ success: boolean; data?: number; error?: string }> => {
  try {
    const response = await api.get('/agents/interactions', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data.length
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error fetching interactions count:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch interactions count'
    };
  }
};

// Legacy token refresh function - now handled by axios interceptors
// Kept for backwards compatibility, but uses tokenManager internally
export const refreshAuthToken = async (): Promise<{ success: boolean; access_token?: string; error?: string }> => {
  try {
    const newToken = await tokenManager.refreshToken();
    return {
      success: true,
      access_token: newToken
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Token refresh failed'
    };
  }
};

export const getBusinessProfiles = async (authToken: string): Promise<{ success: boolean; data?: any[]; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.get('/business-profiles', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error fetching business profiles:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();
      
      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.get('/business-profiles', {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data && retryResponse.data.data) {
            return {
              success: true,
              data: retryResponse.data.data
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }
      
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch business profiles'
    };
  }
};

export const deleteBusinessProfile = async (profileId: string, authToken: string): Promise<{ success: boolean; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.delete(`/business-profiles/${profileId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error deleting business profile:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          await api.delete(`/business-profiles/${profileId}`, {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          return {
            success: true
          };
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to delete business profile'
    };
  }
};

export const createBusinessProfile = async (profileData: BusinessProfileApi, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.post('/business-profiles', profileData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data) {
      return {
        success: true,
        data: response.data
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error creating business profile:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.post('/business-profiles', profileData, {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data) {
            return {
              success: true,
              data: retryResponse.data
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create business profile'
    };
  }
};

export const updateBusinessProfile = async (profileId: string, profileData: any, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.put(`/business-profiles/${profileId}`, profileData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data) {
      return {
        success: true,
        data: response.data
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error updating business profile:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.put(`/business-profiles/${profileId}`, profileData, {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data) {
            return {
              success: true,
              data: retryResponse.data
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update business profile'
    };
  }
};

// Competition API functions
export interface Competition {
  id?: string;
  business_profile_id?: string;
  name: string;
  url?: string;
  description?: string;
  usp?: string;
  created_at?: string;
  updated_at?: string;
}

export const getCompetitions = async (authToken: string, businessProfileId?: string): Promise<{ success: boolean; data?: Competition[]; error?: string; isTokenExpired?: boolean }> => {
  try {
    const params = businessProfileId ? { business_profile_id: businessProfileId } : {};
    const response = await api.get('/competitions', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params
    });

    if (response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error fetching competitions:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.get('/competitions', {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data && retryResponse.data.data) {
            return {
              success: true,
              data: retryResponse.data.data
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch competitions'
    };
  }
};

export const getCompetition = async (competitionId: string, authToken: string): Promise<{ success: boolean; data?: Competition; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.get(`/competitions/${competitionId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data) {
      return {
        success: true,
        data: response.data
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error fetching competition:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.get(`/competitions/${competitionId}`, {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data) {
            return {
              success: true,
              data: retryResponse.data
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch competition'
    };
  }
};

export const createCompetition = async (businessProfileId: string, competitionData: Omit<Competition, 'id' | 'business_profile_id' | 'created_at' | 'updated_at'>, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.post(`/business-profiles/${businessProfileId}/competitions`, competitionData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data) {
      return {
        success: true,
        data: response.data
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error creating competition:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.post(`/business-profiles/${businessProfileId}/competitions`, competitionData, {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data) {
            return {
              success: true,
              data: retryResponse.data
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create competition'
    };
  }
};

export const updateCompetition = async (competitionId: string, competitionData: Partial<Omit<Competition, 'id' | 'business_profile_id' | 'created_at' | 'updated_at'>>, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.put(`/competitions/${competitionId}`, competitionData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data) {
      return {
        success: true,
        data: response.data
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error updating competition:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.put(`/competitions/${competitionId}`, competitionData, {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data) {
            return {
              success: true,
              data: retryResponse.data
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update competition'
    };
  }
};

export const deleteCompetition = async (competitionId: string, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.delete(`/competitions/${competitionId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data) {
      return {
        success: true,
        data: response.data
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error deleting competition:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.delete(`/competitions/${competitionId}`, {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data) {
            return {
              success: true,
              data: retryResponse.data
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to delete competition'
    };
  }
};

// Agents API functions
export const getAgents = async (authToken?: string): Promise<{ success: boolean; data?: any[]; error?: string; isTokenExpired?: boolean }> => {
  try {
    const headers: any = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await api.get('/agents', { headers });

    if (response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error fetching agents:', error);

    // Check if token is expired (if using auth)
    if (authToken && (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed')) {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.get('/agents', {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data && retryResponse.data.data) {
            return {
              success: true,
              data: retryResponse.data.data
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch agents'
    };
  }
};

// Background competitor research
export const startBackgroundCompetitorResearch = async (businessProfileId: string, authToken: string): Promise<{ 
  success: boolean; 
  openaiResponseId?: string; 
  error?: string;
  isTokenExpired?: boolean;
}> => {
  try {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await api.post('/agents/competitors-researcher/tools/find-competitors/call', {
      input: {
        business_profile_id: businessProfileId
      },
      background: true
    }, { headers });

    if (response.data?.data?.status === 'pending' && response.data.data?.openai_response_id) {
      return {
        success: true,
        openaiResponseId: response.data.data.openai_response_id
      };
    } else {
      return {
        success: false,
        error: response.data?.error || 'Failed to start competitor research'
      };
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      return {
        success: false,
        isTokenExpired: true,
        error: 'Token expired'
      };
    }
    console.error('Competitor research start error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start competitor research'
    };
  }
};

// Check competitor research status
export const checkCompetitorResearchStatus = async (openaiResponseId: string, authToken: string): Promise<{
  status: 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed' | 'canceled' | 'error';
  data?: any;
  error?: string;
  isTokenExpired?: boolean;
}> => {
  try {
    const headers: any = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await api.get(`/agents/competitors-researcher/tools/find-competitors/call?job_id=${openaiResponseId}`, { headers });

    if (response.data && response.data.data) {
      const researchData = response.data.data;

      if (researchData.status === 'completed') {
        // Handle different response formats
        let competitors = [];
        if (researchData.competitors) {
          competitors = researchData.competitors;
        } else if (researchData.content && researchData.content.competitors) {
          competitors = researchData.content.competitors;
        } else if (Array.isArray(researchData.content)) {
          competitors = researchData.content;
        }

        return {
          status: 'completed',
          data: competitors
        };
      } else if (researchData.status === 'pending' || researchData.status === 'queued' || researchData.status === 'in_progress') {
        return {
          status: researchData.status
        };
      } else {
        return {
          status: 'error',
          error: researchData.error || researchData.message || 'Unknown status'
        };
      }
    } else if (response.data?.error) {
      return {
        status: 'failed',
        error: response.data.error || 'Research failed'
      };
    } else {
      return {
        status: 'error',
        error: 'Failed to check research status'
      };
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      return {
        status: 'error',
        isTokenExpired: true,
        error: 'Token expired'
      };
    }
    console.error('Research status check error:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to check research status'
    };
  }
};

export const executeAgent = async (agentSlug: string, toolSlug: string = 'analyze-website', inputData?: any, authToken?: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await api.post(`/agents/${agentSlug}/tools/${toolSlug}/call`, inputData || {}, { headers });

    if (response.data) {
      return {
        success: true,
        data: response.data
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error executing agent:', error);

    // Check if token is expired (if using auth)
    if (authToken && (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed')) {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.post(`/agents/${agentSlug}/tools/analyze-website/call`, inputData, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data) {
            return {
              success: true,
              data: retryResponse.data
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to execute agent'
    };
  }
};



// Competition API functions
export const getCompetitionsCount = async (authToken: string, businessProfileId?: string): Promise<{ success: boolean; data?: number; error?: string; isTokenExpired?: boolean }> => {
  try {
    const params = businessProfileId ? { business_profile_id: businessProfileId } : {};
    const response = await api.get('/competitions/count', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params
    });

    if (response.data && typeof response.data.count === 'number') {
      return {
        success: true,
        data: response.data.count
      };
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error fetching competitions count:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.get('/competitions/count', {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data && typeof retryResponse.data.count === 'number') {
            return {
              success: true,
              data: retryResponse.data.count
            };
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch competitions count'
    };
  }
};

export const enrichCompetitor = async (
  input: {name?: string, url?: string}, 
  authToken: string,
  businessProfileId?: string
): Promise<{ 
  success: boolean; 
  data?: Competition; 
  error?: string; 
  isTokenExpired?: boolean 
}> => {
  if (!input.name && !input.url) {
    return {
      success: false,
      error: 'Either name or url is required'
    };
  }

  const requestPayload: any = {
    input: input
  };
  
  // Add business profile ID if provided
  if (businessProfileId) {
    requestPayload.input.business_profile_id = businessProfileId;
  }

  try {

    const response = await api.post('/agents/competitors-researcher/tools/enrich-competitor/call', requestPayload, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data && response.data.data) {
      const enrichmentData = response.data.data;
      
      // Extract the first (and should be only) competitor from the response
      const competitors = enrichmentData.competitors || [];
      if (competitors.length > 0) {
        const enrichedCompetitor = competitors[0];
        
        // Map the enriched data to Competition interface
        const competitionData: Competition = {
          name: enrichedCompetitor.name || '',
          url: enrichedCompetitor.url || input.url || '',
          description: enrichedCompetitor.description || '',
          usp: enrichedCompetitor.usp || ''
        };

        return {
          success: true,
          data: competitionData
        };
      } else {
        return {
          success: false,
          error: 'No competitor data found'
        };
      }
    }

    return {
      success: false,
      error: 'Invalid response format'
    };
  } catch (error: any) {
    console.error('Error enriching competitor:', error);

    // Check if token is expired
    if (error.response?.status === 401 || error.response?.data?.msg === 'Signature verification failed') {
      // Try to refresh the token first
      const refreshResult = await refreshAuthToken();

      if (refreshResult.success && refreshResult.access_token) {
        // Token refreshed successfully, retry the original request
        try {
          const retryResponse = await api.post('/agents/competitors-researcher/tools/enrich-competitor/call', requestPayload, {
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`
            }
          });

          if (retryResponse.data && retryResponse.data.data) {
            const enrichmentData = retryResponse.data.data;
            
            // Extract the first competitor from the response
            const competitors = enrichmentData.competitors || [];
            if (competitors.length > 0) {
              const enrichedCompetitor = competitors[0];
              
              // Map the enriched data to Competition interface
              const competitionData: Competition = {
                name: enrichedCompetitor.name || '',
                url: enrichedCompetitor.url || input.url || '',
                description: enrichedCompetitor.description || '',
                usp: enrichedCompetitor.usp || ''
              };

              return {
                success: true,
                data: competitionData
              };
            } else {
              return {
                success: false,
                error: 'No competitor data found'
              };
            }
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
        }
      }

      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to enrich competitor data'
    };
  }
};

// Offer API functions
export const getOffers = async (authToken: string, businessProfileId: string): Promise<{ success: boolean; data?: Offer[]; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.get(`/business-profiles/${businessProfileId}/offers`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return {
      success: true,
      data: response.data.data || []
    };
  } catch (error: any) {
    console.error('Error fetching offers:', error);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch offers'
    };
  }
};

export const getOffersCount = async (authToken: string, businessProfileId?: string): Promise<{ success: boolean; data?: number; error?: string; isTokenExpired?: boolean }> => {
  try {
    const params = businessProfileId ? { business_profile_id: businessProfileId } : {};
    const response = await api.get('/offers/count', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params
    });

    return {
      success: true,
      data: response.data.count || 0
    };
  } catch (error: any) {
    console.error('Error fetching offers count:', error);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch offers count'
    };
  }
};

export const getOffer = async (offerId: string, authToken: string): Promise<{ success: boolean; data?: Offer; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.get(`/offers/${offerId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error fetching offer:', error);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch offer'
    };
  }
};

export const createOffer = async (businessProfileId: string, offerData: Omit<Offer, 'id' | 'business_profile_id' | 'created_at' | 'updated_at'>, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.post(`/business-profiles/${businessProfileId}/offers`, offerData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error creating offer:', error);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create offer'
    };
  }
};

export const updateOffer = async (offerId: string, offerData: Partial<Omit<Offer, 'id' | 'business_profile_id' | 'created_at' | 'updated_at'>>, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.put(`/offers/${offerId}`, offerData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error updating offer:', error);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update offer'
    };
  }
};

export const deleteOffer = async (offerId: string, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.delete(`/offers/${offerId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error deleting offer:', error);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to delete offer'
    };
  }
};

export const generateOffers = async (businessProfileId: string, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.post(`/business-profiles/${businessProfileId}/generate-offers`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error generating offers:', error);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to generate offers'
    };
  }
};

export const saveSelectedOffers = async (businessProfileId: string, selectedOffers: any[], authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.post(`/business-profiles/${businessProfileId}/save-selected-offers`, {
      selected_offers: selectedOffers
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error saving selected offers:', error);
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to save selected offers'
    };
  }
};

// Campaign API functions
export const getCampaigns = async (authToken: string, businessProfileId: string): Promise<{ success: boolean; data?: Campaign[]; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.get(`/business-profiles/${businessProfileId}/campaigns`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error getting campaigns:', error);
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get campaigns'
    };
  }
};

export const getCampaign = async (campaignId: string, authToken: string): Promise<{ success: boolean; data?: Campaign; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.get(`/campaigns/${campaignId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error getting campaign:', error);
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get campaign'
    };
  }
};

export const createCampaign = async (businessProfileId: string, campaignData: Omit<Campaign, 'id' | 'business_profile_id' | 'user_id' | 'created_at' | 'updated_at'>, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.post(`/business-profiles/${businessProfileId}/campaigns`, campaignData, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create campaign'
    };
  }
};

export const updateCampaign = async (campaignId: string, campaignData: Partial<Omit<Campaign, 'id' | 'business_profile_id' | 'user_id' | 'created_at' | 'updated_at'>>, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.put(`/campaigns/${campaignId}`, campaignData, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update campaign'
    };
  }
};

export const deleteCampaign = async (campaignId: string, authToken: string): Promise<{ success: boolean; data?: any; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.delete(`/campaigns/${campaignId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to delete campaign'
    };
  }
};

// Generate campaign using OpenAI async processing pattern
export const generateCampaign = async (businessProfileId: string, params: CampaignGenerationParams, authToken: string): Promise<{ success: boolean; jobId?: string; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.post(`/agents/campaign-generator/tools/generate-campaign/call`, {
      input: {
        business_profile_id: businessProfileId,
        campaign_goal: params.campaign_goal,
        budget: params.budget,
        deadline: params.deadline,
        selected_products: params.selected_products
      },
      background: true
    }, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    return {
      success: true,
      jobId: response.data.data?.openai_response_id || response.data.openai_response_id || response.data.job_id || response.data.data?.job_id
    };
  } catch (error: any) {
    console.error('Error generating campaign:', error);
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to generate campaign'
    };
  }
};

// Poll campaign generation status using job ID
export const getCampaignGenerationStatus = async (jobId: string, authToken: string): Promise<{ success: boolean; status?: string; data?: CampaignGenerationResult; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.get(`/agents/campaign-generator/tools/generate-campaign/call?job_id=${jobId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    const responseData = response.data;
    const actualStatus = responseData.data?.status || responseData.status;
    
    // When completed, wrap the response data in the expected campaign_data structure
    let campaignResult = undefined;
    if (actualStatus === 'completed' && responseData.data) {
      // Fix field name mismatches and normalize the structure
      const normalizedData = {
        ...responseData.data,
        risks_recommendations: responseData.data.risks_and_recommendations || responseData.data.risks_recommendations
      };
      
      campaignResult = {
        campaign_data: normalizedData,
        business_profile_id: '', // Will be set by the component
        campaign_params: {
          campaign_goal: 'Brand Awareness' as CampaignGoal, // Default value, will be updated by component
          budget: undefined,
          deadline: undefined,
          selected_products: []
        }
      };
    }
    
    return {
      success: true,
      status: actualStatus,
      data: campaignResult
    };
  } catch (error: any) {
    console.error('Error getting campaign generation status:', error);
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get campaign generation status'
    };
  }
};

export const saveCampaign = async (businessProfileId: string, campaignData: { campaign_params: CampaignGenerationParams; campaign_data: any }, authToken: string): Promise<{ success: boolean; data?: Campaign; error?: string; isTokenExpired?: boolean }> => {
  try {
    const response = await api.post(`/business-profiles/${businessProfileId}/campaigns/save`, campaignData, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error saving campaign:', error);
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to save campaign'
    };
  }
};

export const getCampaignsCount = async (authToken: string, businessProfileId?: string): Promise<{ success: boolean; data?: number; error?: string; isTokenExpired?: boolean }> => {
  try {
    const params = businessProfileId ? { business_profile_id: businessProfileId } : {};
    const response = await api.get('/campaigns/count', {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      params
    });
    
    return {
      success: true,
      data: response.data.data.count
    };
  } catch (error: any) {
    console.error('Error getting campaigns count:', error);
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication token expired. Please log in again.',
        isTokenExpired: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get campaigns count'
    };
  }
};

export default api;
