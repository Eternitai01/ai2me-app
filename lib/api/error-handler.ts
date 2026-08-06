/**
 * Centralized error handling for API calls
 */

import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  statusCode: number;
  errorCode?: string;
  details?: unknown;
}

export class ApiErrorHandler {
  /**
   * Extract error message from various error types
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      // API error response
      if (error.response?.data?.detail) {
        return String(error.response.data.detail);
      }

      // HTTP status messages
      switch (error.response?.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication required. Please log in.';
        case 403:
          return "You don't have permission to perform this action.";
        case 404:
          return 'Resource not found.';
        case 409:
          return 'Conflict: Resource already exists.';
        case 422:
          return 'Validation error. Please check your input.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service unavailable. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'An unknown error occurred.';
  }

  /**
   * Parse API error into structured format
   */
  static parseError(error: unknown): ApiError {
    if (error instanceof AxiosError) {
      return {
        message: this.getErrorMessage(error),
        statusCode: error.response?.status || 500,
        errorCode: error.code,
        details: error.response?.data,
      };
    }

    return {
      message: this.getErrorMessage(error),
      statusCode: 500,
    };
  }

  /**
   * Check if error is due to network issues
   */
  static isNetworkError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      return !error.response && !!error.request;
    }
    return false;
  }

  /**
   * Check if error is due to authentication
   */
  static isAuthError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      return error.response?.status === 401;
    }
    return false;
  }

  /**
   * Check if error is due to authorization
   */
  static isPermissionError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      return error.response?.status === 403;
    }
    return false;
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      return error.response?.status === 422 || error.response?.status === 400;
    }
    return false;
  }

  /**
   * Check if error is retriable (temporary failure)
   */
  static isRetriableError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      // Retry on network errors, server errors, and rate limits
      return (
        !error.response || // Network error
        status === 429 || // Rate limit
        status === 503 || // Service unavailable
        (status !== undefined && status >= 500 && status < 600) // Server errors
      );
    }
    return false;
  }

  /**
   * Get user-friendly error message with suggestions
   */
  static getUserFriendlyMessage(error: unknown): string {
    if (this.isNetworkError(error)) {
      return 'Network connection lost. Please check your internet connection and try again.';
    }

    if (this.isAuthError(error)) {
      return 'Your session has expired. Please log in again.';
    }

    if (this.isPermissionError(error)) {
      return "You don't have permission to access this resource. Please contact your administrator.";
    }

    return this.getErrorMessage(error);
  }

  /**
   * Log error for monitoring
   */
  static logError(error: unknown, context?: string): void {
    const parsedError = this.parseError(error);

    console.error('[API Error]', {
      context,
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      errorCode: parsedError.errorCode,
      timestamp: new Date().toISOString(),
    });

    // In production, send to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Example: Sentry.captureException(error);
    }
  }
}

/**
 * Async wrapper with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorContext?: string
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    if (errorContext) {
      ApiErrorHandler.logError(error, errorContext);
    }
    return { data: null, error: ApiErrorHandler.parseError(error) };
  }
}

/**
 * Retry logic for API calls
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retriable
      if (!ApiErrorHandler.isRetriableError(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
