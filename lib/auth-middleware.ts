/**
 * Authentication Middleware for Blockchain API Routes
 * Validates user authentication and permissions for blockchain access
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from './backend-api';


export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  permissions: string[];
  role: string;
}

/**
 * Authenticate blockchain API access
 */
export async function authenticateBlockchainAccess(): Promise<AuthenticatedUser> {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    
    if (!authToken) {
      throw new Error('Authentication required - no auth token found');
    }

    // Call the backend /api/auth/me endpoint to verify the user
    const backendUrl = getBackendUrl();
    
    const response = await fetch(`${backendUrl}/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Authentication failed: ${errorData.detail || 'Invalid token'}`);
    }

    const userData = await response.json();
    const backendUser = userData.data || userData;

    // Map BackendUser to AuthenticatedUser format
    const user: AuthenticatedUser = {
      id: backendUser.id,
      email: backendUser.email,
      organizationId: backendUser.organization_id,
      permissions: ['blockchain_access'], // Default permission for authenticated users
      role: backendUser.role,
    };

    // Validate required fields
    if (!user.id || !user.email || !user.organizationId) {
      throw new Error('Invalid user data - missing required fields');
    }

    // Check if user is active and verified
    if (!backendUser.is_active) {
      throw new Error('User account is inactive');
    }

    if (!backendUser.is_verified) {
      throw new Error('User account is not verified');
    }

    // Check blockchain access permissions based on role
    const hasBlockchainAccess = 
      user.role === 'admin' ||
      user.role === 'owner' ||
      user.role === 'user'; // All authenticated users have blockchain access

    if (!hasBlockchainAccess) {
      throw new Error('Insufficient permissions for blockchain access');
    }

    console.log('Blockchain authentication successful for user:', user.email);
    return user;

  } catch (error) {
    console.error('Blockchain authentication failed:', error);
    throw error;
  }
}

/**
 * Create authentication error response
 */
export function createAuthErrorResponse(error: Error, status: number = 401) {
  return new Response(
    JSON.stringify({
      error: 'Authentication Failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Middleware wrapper for blockchain routes
 */
export function withBlockchainAuth<T extends unknown[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await authenticateBlockchainAccess();
      return await handler(request, user, ...args);
    } catch (error) {
      return createAuthErrorResponse(
        error instanceof Error ? error : new Error('Authentication failed'),
        error instanceof Error && error.message.includes('permissions') ? 403 : 401
      );
    }
  };
}

/**
 * Get organization filter for database queries
 */
export function getOrgFilter(user: AuthenticatedUser): string {
  // For admin users, allow access to all organizations
  if (user.role === 'admin' || user.permissions.includes('admin')) {
    return ''; // No filter
  }
  
  // For regular users, filter by their organization
  return user.organizationId;
}

/**
 * Validate request parameters
 */
export function validateRequestParams(
  searchParams: URLSearchParams, 
  requiredParams: string[] = [],
  optionalParams: Record<string, string> = {}
): Record<string, string> {
  const params: Record<string, string> = {};

  // Check required parameters
  for (const param of requiredParams) {
    const value = searchParams.get(param);
    if (!value) {
      throw new Error(`Missing required parameter: ${param}`);
    }
    params[param] = value;
  }

  // Add optional parameters with defaults
  for (const [param, defaultValue] of Object.entries(optionalParams)) {
    params[param] = searchParams.get(param) || defaultValue;
  }

  return params;
}
