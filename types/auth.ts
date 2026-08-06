/**
 * Authentication and User Types
 * Centralized type definitions for user authentication and authorization
 */

export interface AuthenticatedUser {
  email: string;
  organizationId: string;
  id: string;
  permissions: string[];
  role: string;
}

export interface AuthRequest {
  user: AuthenticatedUser;
}

export interface JWTError {
  name: string;
  message: string;
}

export interface AuthMiddleware {
  (request: Request, user: AuthenticatedUser): Promise<Response>;
}
