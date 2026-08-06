// Role-based permissions system

export type UserRole =
  | "admin"
  | "developer"
  | "compliance-officer"
  | "executive"
  | "user";

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Define all available permissions
export const PERMISSIONS = {
  // User Management
  CREATE_USERS: {
    id: "create_users",
    name: "Create Users",
    description: "Create new users in the organization",
  },
  MANAGE_USERS: {
    id: "manage_users",
    name: "Manage Users",
    description: "Edit and delete users",
  },
  VIEW_USERS: {
    id: "view_users",
    name: "View Users",
    description: "View user list and details",
  },

  // API Keys
  CREATE_API_KEYS: {
    id: "create_api_keys",
    name: "Create API Keys",
    description: "Generate new API keys",
  },
  MANAGE_API_KEYS: {
    id: "manage_api_keys",
    name: "Manage API Keys",
    description: "Edit and revoke API keys",
  },
  VIEW_API_KEYS: {
    id: "view_api_keys",
    name: "View API Keys",
    description: "View API key list and details",
  },

  // AI Gateway
  RUN_AI_ENDPOINTS: {
    id: "run_ai_endpoints",
    name: "Run AI Endpoints",
    description: "Execute AI gateway endpoints",
  },
  VIEW_AI_ENDPOINTS: {
    id: "view_ai_endpoints",
    name: "View AI Endpoints",
    description: "View AI endpoint configurations",
  },

  // Connectors
  CREATE_CONNECTORS: {
    id: "create_connectors",
    name: "Create Connectors",
    description: "Add new data connectors",
  },
  MODIFY_CONNECTORS: {
    id: "modify_connectors",
    name: "Modify Connectors",
    description: "Edit existing connectors",
  },
  VIEW_CONNECTORS: {
    id: "view_connectors",
    name: "View Connectors",
    description: "View connector list and details",
  },

  // Compliance
  VIEW_COMPLIANCE: {
    id: "view_compliance",
    name: "View Compliance",
    description: "Access compliance dashboard and reports",
  },
  MANAGE_COMPLIANCE: {
    id: "manage_compliance",
    name: "Manage Compliance",
    description: "Configure compliance settings",
  },

  // Analytics & Usage
  VIEW_USAGE_ANALYSIS: {
    id: "view_usage_analysis",
    name: "View Usage Analysis",
    description: "Access usage analytics and reports",
  },
  VIEW_COST_MANAGEMENT: {
    id: "view_cost_management",
    name: "View Cost Management",
    description: "Access cost analysis and billing",
  },

  // Organization Settings
  MANAGE_ORGANIZATION: {
    id: "manage_organization",
    name: "Manage Organization",
    description: "Edit organization settings",
  },
  VIEW_ORGANIZATION: {
    id: "view_organization",
    name: "View Organization",
    description: "View organization details",
  },

  // Dashboard
  VIEW_DASHBOARD: {
    id: "view_dashboard",
    name: "View Dashboard",
    description: "Access main dashboard",
  },

  // Waitlist (admin-only)
  VIEW_WAITLIST: {
    id: "view_waitlist",
    name: "View Waitlist",
    description: "View waitlist entries in the dashboard",
  },

  // Playground
  VIEW_PLAYGROUND:{
    id: "view_playground",
    name: "View Playground",
    description: "Access playground",
  }
} as const;

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Admin has all permissions
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_API_KEYS,
    PERMISSIONS.MANAGE_API_KEYS,
    PERMISSIONS.VIEW_API_KEYS,
    PERMISSIONS.RUN_AI_ENDPOINTS,
    PERMISSIONS.VIEW_AI_ENDPOINTS,
    PERMISSIONS.CREATE_CONNECTORS,
    PERMISSIONS.MODIFY_CONNECTORS,
    PERMISSIONS.VIEW_CONNECTORS,
    PERMISSIONS.VIEW_COMPLIANCE,
    PERMISSIONS.MANAGE_COMPLIANCE,
    PERMISSIONS.VIEW_USAGE_ANALYSIS,
    PERMISSIONS.VIEW_COST_MANAGEMENT,
    PERMISSIONS.MANAGE_ORGANIZATION,
    PERMISSIONS.VIEW_ORGANIZATION,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PLAYGROUND,
    PERMISSIONS.VIEW_WAITLIST,
  ],

  developer: [
    // Developer can create access keys, run AI endpoints, and manage connectors
    PERMISSIONS.CREATE_API_KEYS,
    PERMISSIONS.MANAGE_API_KEYS,
    PERMISSIONS.VIEW_API_KEYS,
    PERMISSIONS.RUN_AI_ENDPOINTS,
    PERMISSIONS.VIEW_AI_ENDPOINTS,
    PERMISSIONS.CREATE_CONNECTORS,
    PERMISSIONS.MODIFY_CONNECTORS,
    PERMISSIONS.VIEW_CONNECTORS,
    PERMISSIONS.VIEW_DASHBOARD,
  ],

  "compliance-officer": [
    // Compliance Officer only has access to compliance page
    PERMISSIONS.VIEW_COMPLIANCE,
    PERMISSIONS.MANAGE_COMPLIANCE,
    PERMISSIONS.VIEW_DASHBOARD,
  ],

  executive: [
    // Executive can do usage analysis and cost management
    PERMISSIONS.VIEW_USAGE_ANALYSIS,
    PERMISSIONS.VIEW_COST_MANAGEMENT,
    PERMISSIONS.VIEW_DASHBOARD,
  ],

  user: [
    // Normal user: everything except admin-only waitlist and admin-only user/org management
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_USAGE_ANALYSIS,
    PERMISSIONS.VIEW_COST_MANAGEMENT,
    PERMISSIONS.VIEW_COMPLIANCE,
    PERMISSIONS.VIEW_CONNECTORS,
    PERMISSIONS.VIEW_PLAYGROUND,
    PERMISSIONS.VIEW_ORGANIZATION,
  ],
};

// Helper functions
export function hasPermission(
  userRole: UserRole,
  permissionId: string
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions || !Array.isArray(rolePermissions)) return false;
  return rolePermissions.some((permission) => permission.id === permissionId);
}

export function hasAnyPermission(
  userRole: UserRole,
  permissionIds: string[]
): boolean {
  return permissionIds.some((permissionId) =>
    hasPermission(userRole, permissionId)
  );
}

export function hasAllPermissions(
  userRole: UserRole,
  permissionIds: string[]
): boolean {
  return permissionIds.every((permissionId) =>
    hasPermission(userRole, permissionId)
  );
}

export function getRolePermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Define route-to-permission mapping
  const routePermissions: Record<string, string[]> = {
    "/dashboard": [PERMISSIONS.VIEW_DASHBOARD.id],
    "/dashboard/api-keys": [PERMISSIONS.VIEW_API_KEYS.id],
    "/dashboard/connectors": [PERMISSIONS.VIEW_CONNECTORS.id],
    "/dashboard/ai-gateway": [PERMISSIONS.VIEW_AI_ENDPOINTS.id],
    "/dashboard/compliance": [PERMISSIONS.VIEW_COMPLIANCE.id],
    "/dashboard/analytics": [PERMISSIONS.VIEW_USAGE_ANALYSIS.id],
    "/dashboard/costs": [PERMISSIONS.VIEW_COST_MANAGEMENT.id],
    "/dashboard/settings": [PERMISSIONS.VIEW_ORGANIZATION.id],
    "/dashboard/team": [PERMISSIONS.VIEW_USERS.id],
    "/dashboard/playground": [PERMISSIONS.VIEW_PLAYGROUND.id],
    "/dashboard/waitlist": [PERMISSIONS.VIEW_WAITLIST.id],
  };

  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) return true; // Allow access to undefined routes

  return hasAnyPermission(userRole, requiredPermissions);
}
