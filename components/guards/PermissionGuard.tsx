"use client";

import { useAuth } from "@/context/AuthContext";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  UserRole,
} from "@/lib/permissions";
import { ReactNode } from "react";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  role?: UserRole;
}

export function PermissionGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  role,
}: PermissionGuardProps) {
  const { user, loading } = useAuth();

  // Use provided role or get from user context
  const userRole = (role || user?.role) as UserRole;

  // If still loading auth, show fallback to prevent flash
  if (loading || !user) {
    return <>{fallback}</>;
  }

  // If no role available, show fallback
  if (!userRole) {
    return <>{fallback}</>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(userRole, permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(userRole, permissions)
      : hasAnyPermission(userRole, permissions);
  } else {
    // If no permissions specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common use cases
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard permission="create_users" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function DeveloperOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard permission="create_api_keys" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ComplianceOfficerOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard permission="view_compliance" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ExecutiveOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard permission="view_usage_analysis" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
