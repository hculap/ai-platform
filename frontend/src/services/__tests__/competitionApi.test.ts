import axios from 'axios';
import {
  getCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  type Competition
} from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Competition API', () => {
  const mockAuthToken = 'mock-jwt-token';
  const mockCompetition: Competition = {
    id: 'competition-123',
    business_profile_id: 'profile-123',
    name: 'Acme Widget Co',
    url: 'https://acmewidget.com',
    description: 'Leading supplier of modular widgets for industrial applications.',
    usp: 'Largest selection of widget customizations in North America.',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('getCompetitions', () => {
    it('should fetch competitions successfully', async () => {
      const mockResponse = {
        data: {
          data: [mockCompetition]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getCompetitions(mockAuthToken);

      expect(mockedAxios.get).toHaveBeenCalledWith('/competitions', {
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockCompetition]);
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      const result = await getCompetitions(mockAuthToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('should handle token expiration and refresh', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { msg: 'Signature verification failed' }
        }
      };

      const refreshResponse = {
        data: { access_token: 'new-token' }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.post.mockResolvedValueOnce(refreshResponse);
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [mockCompetition] }
      });

      localStorageMock.getItem.mockReturnValue('refresh-token');

      const result = await getCompetitions(mockAuthToken);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/refresh', {}, {
        headers: { 'Authorization': 'Bearer refresh-token' }
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      expect(result.success).toBe(true);
    });
  });

  describe('getCompetition', () => {
    it('should fetch single competition successfully', async () => {
      const mockResponse = {
        data: mockCompetition
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getCompetition('competition-123', mockAuthToken);

      expect(mockedAxios.get).toHaveBeenCalledWith('/competitions/competition-123', {
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCompetition);
    });

    it('should handle 404 errors', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Competition not found' }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      const result = await getCompetition('non-existent-id', mockAuthToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Competition not found');
    });
  });

  describe('createCompetition', () => {
    const newCompetitionData = {
      name: 'New Competition',
      url: 'https://newcompetition.com',
      description: 'A new competitor in the market.',
      usp: 'Innovative solutions for modern businesses.'
    };

    it('should create competition successfully', async () => {
      const mockResponse = {
        data: {
          id: 'new-competition-123',
          message: 'Competition created successfully'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await createCompetition('profile-123', newCompetitionData, mockAuthToken);

      expect(mockedAxios.post).toHaveBeenCalledWith('/business-profiles/profile-123/competitions', newCompetitionData, {
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('should handle validation errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Name is required' }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const result = await createCompetition('profile-123', { name: '' }, mockAuthToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('should handle 403 access denied errors', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { message: 'Access denied' }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const result = await createCompetition('profile-123', newCompetitionData, mockAuthToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });
  });

  describe('updateCompetition', () => {
    const updateData = {
      name: 'Updated Competition Name',
      url: 'https://updated.com'
    };

    it('should update competition successfully', async () => {
      const mockResponse = {
        data: {
          id: 'competition-123',
          updated_at: '2025-01-02T00:00:00Z',
          message: 'Competition updated successfully'
        }
      };

      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const result = await updateCompetition('competition-123', updateData, mockAuthToken);

      expect(mockedAxios.put).toHaveBeenCalledWith('/competitions/competition-123', updateData, {
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'New Name Only' };
      const mockResponse = {
        data: { message: 'Competition updated successfully' }
      };

      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const result = await updateCompetition('competition-123', partialUpdate, mockAuthToken);

      expect(mockedAxios.put).toHaveBeenCalledWith('/competitions/competition-123', partialUpdate, {
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`
        }
      });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteCompetition', () => {
    it('should delete competition successfully', async () => {
      const mockResponse = {
        data: {
          id: 'competition-123',
          message: 'Competition deleted successfully'
        }
      };

      mockedAxios.delete.mockResolvedValueOnce(mockResponse);

      const result = await deleteCompetition('competition-123', mockAuthToken);

      expect(mockedAxios.delete).toHaveBeenCalledWith('/competitions/competition-123', {
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('should handle deletion of non-existent competition', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Competition not found' }
        }
      };

      mockedAxios.delete.mockRejectedValueOnce(mockError);

      const result = await deleteCompetition('non-existent-id', mockAuthToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Competition not found');
    });
  });

  describe('Error handling and token refresh', () => {
    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      const result = await getCompetitions(mockAuthToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network Error');
    });

    it('should handle token refresh failure', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { msg: 'Signature verification failed' }
        }
      };

      // Token refresh fails
      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.post.mockRejectedValueOnce(new Error('Refresh failed'));
      localStorageMock.getItem.mockReturnValue('refresh-token');

      const result = await getCompetitions(mockAuthToken);

      expect(result.success).toBe(false);
      expect(result.isTokenExpired).toBe(true);
    });

    it('should clear tokens when refresh fails', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { msg: 'Signature verification failed' }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.post.mockRejectedValueOnce(new Error('Refresh failed'));
      localStorageMock.getItem.mockReturnValue('refresh-token');

      await getCompetitions(mockAuthToken);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('Data validation', () => {
    it('should handle malformed API responses', async () => {
      mockedAxios.get.mockResolvedValueOnce({});

      const result = await getCompetitions(mockAuthToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid response format');
    });

    it('should handle responses without data field', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {}
      });

      const result = await getCompetitions(mockAuthToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid response format');
    });
  });
});
