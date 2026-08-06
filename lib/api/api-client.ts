/**
 * Type-safe API client with error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiErrorHandler, withErrorHandling, retryWithBackoff } from './error-handler';
import { getPublicApiBaseUrl } from '@/lib/api-base';

// Define base response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

// API client configuration
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  withCredentials?: boolean;
  headers?: Record<string, string>;
}

/**
 * Type-safe API client class
 */
export class TypeSafeApiClient {
  private client: AxiosInstance;
  private lastTokenCheck = 0;
  private readonly TOKEN_CHECK_INTERVAL = 300000 ; // Check every 5 minutes
  private readonly TOKEN_REFRESH_THRESHOLD = 3600; // Refresh when < 1 hour remains (in seconds)
  private isRefreshing = false;

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      withCredentials: config.withCredentials ?? true,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Check and refresh token if needed before each request
        await this.checkAndRefreshToken();

        // Add auth token if available
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle auth errors globally
        if (ApiErrorHandler.isAuthError(error)) {
          // Redirect to login or refresh token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Check token expiry and refresh if needed
   */
  private async checkAndRefreshToken(): Promise<void> {
    // Only check periodically to avoid too many calls
    const now = Date.now();
    if (now - this.lastTokenCheck < this.TOKEN_CHECK_INTERVAL) {
      return;
    }

    this.lastTokenCheck = now;

    // Skip if already refreshing
    if (this.isRefreshing) {
      return;
    }

    // Only run in browser
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Get token from cookie using a simple helper
      const token = this.getCookie('auth-token');
      if (!token) {
        return;
      }

      // Decode JWT to check expiry (without verification)
      const payload = this.decodeJWT(token);
      if (!payload || !payload.exp) {
        return;
      }

      // Check if token expires in less than threshold
      const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
      
      if (expiresIn < this.TOKEN_REFRESH_THRESHOLD) {
        this.isRefreshing = true;

        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          console.warn('Token refresh failed:', response.status);
          if (response.status === 401) {
            // Token completely invalid, redirect to login
            window.location.href = '/';
          }
        }

        this.isRefreshing = false;
      }
    } catch (error) {
      console.warn('Token check/refresh error:', error);
      this.isRefreshing = false;
    }
  }

  /**
   * Simple cookie getter
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex);
      const value = trimmed.slice(separatorIndex + 1);
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Decode JWT payload (no verification, client-side only for expiry check)
   */
  private decodeJWT(token: string): { exp?: number; [key: string]: any } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * GET request with type safety
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * GET request with error handling
   */
  async getSafe<T>(url: string, config?: AxiosRequestConfig) {
    return withErrorHandling(
      () => this.get<T>(url, config),
      `GET ${url}`
    );
  }

  /**
   * POST request with type safety
   */
  async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * POST request with error handling
   */
  async postSafe<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ) {
    return withErrorHandling(
      () => this.post<T, D>(url, data, config),
      `POST ${url}`
    );
  }

  /**
   * PUT request with type safety
   */
  async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request with error handling
   */
  async putSafe<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ) {
    return withErrorHandling(
      () => this.put<T, D>(url, data, config),
      `PUT ${url}`
    );
  }

  /**
   * DELETE request with type safety
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * DELETE request with error handling
   */
  async deleteSafe<T>(url: string, config?: AxiosRequestConfig) {
    return withErrorHandling(
      () => this.delete<T>(url, config),
      `DELETE ${url}`
    );
  }

  /**
   * GET request with retry logic
   */
  async getWithRetry<T>(
    url: string,
    config?: AxiosRequestConfig,
    maxRetries: number = 3
  ): Promise<T> {
    return retryWithBackoff(
      () => this.get<T>(url, config),
      maxRetries
    );
  }

  /**
   * POST request with retry logic
   */
  async postWithRetry<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
    maxRetries: number = 3
  ): Promise<T> {
    return retryWithBackoff(
      () => this.post<T, D>(url, data, config),
      maxRetries
    );
  }
}

// Create default API client instance
const apiClient = new TypeSafeApiClient({
  baseURL: getPublicApiBaseUrl(),
});

export default apiClient;

// Export typed request functions
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config),

  getSafe: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.getSafe<T>(url, config),

  post: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
    apiClient.post<T, D>(url, data, config),

  postSafe: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
    apiClient.postSafe<T, D>(url, data, config),

  put: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
    apiClient.put<T, D>(url, data, config),

  putSafe: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
    apiClient.putSafe<T, D>(url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config),

  deleteSafe: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.deleteSafe<T>(url, config),
};
