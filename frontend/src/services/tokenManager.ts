import axios from 'axios';

// Constants
const TOKEN_REFRESH_BUFFER_MINUTES = 5; // Refresh token 5 minutes before expiry
const TOKEN_CHECK_INTERVAL_MS = 60000; // Check token every minute
const MAX_RETRY_ATTEMPTS = 3;

// Token refresh state
let refreshPromise: Promise<string> | null = null;
let tokenCheckInterval: NodeJS.Timeout | null = null;

/**
 * Centralized token management service
 * Handles automatic token refresh, expiration monitoring, and session persistence
 */
export class TokenManager {
  private static instance: TokenManager;
  private onTokenRefreshedCallback: ((newToken: string) => void) | null = null;
  private onLogoutCallback: (() => void) | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Set callbacks for token events
   */
  setCallbacks(onTokenRefreshed: (newToken: string) => void, onLogout: () => void) {
    this.onTokenRefreshedCallback = onTokenRefreshed;
    this.onLogoutCallback = onLogout;
  }

  /**
   * Get current auth token from localStorage
   */
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Check if current token is valid and not expired
   */
  isTokenValid(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;

    try {
      const payload = this.parseJWT(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * Get token expiration time in seconds
   */
  getTokenExpiry(): number | null {
    const token = this.getAuthToken();
    if (!token) return null;

    try {
      const payload = this.parseJWT(token);
      return payload.exp || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if token needs refresh (expires within buffer time)
   */
  needsRefresh(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = TOKEN_REFRESH_BUFFER_MINUTES * 60;
    
    return expiry - currentTime <= bufferTime;
  }

  /**
   * Parse JWT token payload
   */
  private parseJWT(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  /**
   * Refresh auth token using refresh token
   * Returns a promise that resolves to the new access token
   */
  async refreshToken(): Promise<string> {
    // If refresh is already in progress, return the existing promise
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = this.performTokenRefresh();
    
    try {
      const newToken = await refreshPromise;
      refreshPromise = null;
      return newToken;
    } catch (error) {
      refreshPromise = null;
      throw error;
    }
  }

  /**
   * Perform the actual token refresh API call
   */
  private async performTokenRefresh(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        }
      );

      if (response.data && response.data.access_token) {
        const newToken = response.data.access_token;
        
        // Update localStorage
        localStorage.setItem('authToken', newToken);
        
        // Notify callback
        if (this.onTokenRefreshedCallback) {
          this.onTokenRefreshedCallback(newToken);
        }

        console.log('Token refreshed successfully');
        return newToken;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      
      // If refresh fails, clear all tokens and logout
      this.clearTokens();
      
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  async getValidToken(): Promise<string> {
    const currentToken = this.getAuthToken();
    
    if (!currentToken || !this.isTokenValid() || this.needsRefresh()) {
      try {
        return await this.refreshToken();
      } catch (error) {
        // If refresh fails, logout user
        this.logout();
        throw error;
      }
    }
    
    return currentToken;
  }

  /**
   * Start background token monitoring
   */
  startTokenMonitoring() {
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
    }

    tokenCheckInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, TOKEN_CHECK_INTERVAL_MS);

    // Initial check
    setTimeout(() => this.checkAndRefreshToken(), 1000);
  }

  /**
   * Stop background token monitoring
   */
  stopTokenMonitoring() {
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
      tokenCheckInterval = null;
    }
  }

  /**
   * Check token and refresh if needed (background process)
   */
  private async checkAndRefreshToken() {
    try {
      const token = this.getAuthToken();
      if (!token) return;

      if (this.needsRefresh()) {
        console.log('Proactively refreshing token...');
        await this.refreshToken();
      }
    } catch (error) {
      console.error('Background token refresh failed:', error);
      // Don't logout on background refresh failure to avoid disrupting user
      // Let the API interceptor handle it when user makes next request
    }
  }

  /**
   * Clear all tokens and logout
   */
  logout() {
    this.clearTokens();
    this.stopTokenMonitoring();
    
    if (this.onLogoutCallback) {
      this.onLogoutCallback();
    }
  }

  /**
   * Clear tokens from localStorage
   */
  private clearTokens() {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken() && this.isTokenValid();
  }

  /**
   * Initialize token manager with stored tokens
   */
  initialize(): boolean {
    const token = this.getAuthToken();
    const user = localStorage.getItem('user');
    
    if (token && user && this.isTokenValid()) {
      this.startTokenMonitoring();
      return true;
    } else if (token) {
      // Token exists but is invalid, try to refresh
      this.checkAndRefreshToken();
      return false;
    }
    
    return false;
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
export default tokenManager;