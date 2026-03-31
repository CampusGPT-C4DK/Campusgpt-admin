/**
 * Role-Based Access Control (RBAC) Utilities
 * Handles permission checking based on user role and features_access
 */

export type UserRole = 'admin' | 'faculty' | 'student';

export type FeatureId = 
  | 'chat' 
  | 'documents' 
  | 'history' 
  | 'admin_dashboard' 
  | 'user_management' 
  | 'settings';

// Feature definitions with allowed roles
// ONLY features for pages that exist in sidebar
export const FEATURE_CONFIG: Record<FeatureId, { name: string; roles: UserRole[] }> = {
  chat: { name: 'AI Chat', roles: ['student', 'faculty', 'admin'] },
  documents: { name: 'Documents', roles: ['faculty', 'admin'] },
  history: { name: 'Chat History', roles: ['student', 'faculty', 'admin'] },
  admin_dashboard: { name: 'Admin Dashboard', roles: ['admin'] },
  user_management: { name: 'Users', roles: ['admin'] },
  settings: { name: 'Settings', roles: ['admin', 'faculty', 'student'] },
};

// Page to feature mapping
// NOTE: /dashboard (main page) is accessible to all authenticated users
export const PAGE_FEATURE_MAP: Record<string, FeatureId | null> = {
  '/dashboard': null, // Main dashboard - accessible to all authenticated users
  '/dashboard/documents': 'documents',
  '/dashboard/chat': 'chat',
  '/dashboard/chats': 'history',
  '/dashboard/users': 'user_management',
  '/dashboard/settings': 'settings',
};

/**
 * Get default features enabled for a user based on their role
 * (without considering admin overrides)
 */
export function getDefaultFeaturesForRole(role: UserRole): Record<FeatureId, boolean> {
  const features: Record<FeatureId, boolean> = {
    chat: false,
    documents: false,
    history: false,
    admin_dashboard: false,
    user_management: false,
    settings: false,
  };

  Object.entries(FEATURE_CONFIG).forEach(([featureId, config]) => {
    if (config.roles.includes(role)) {
      features[featureId as FeatureId] = true;
    }
  });

  return features;
}

/**
 * Check if a user can access a specific feature
 * Returns true if:
 * 1. User's role allows the feature (base permission), AND
 * 2. features_access is undefined (legacy), OR
 * 3. features_access explicitly allows the feature
 */
export function canAccessFeature(
  userRole: UserRole,
  featureId: FeatureId,
  featuresAccess?: Record<string, boolean> | null
): boolean {
  // Check if role allows this feature
  const roleAllows = FEATURE_CONFIG[featureId]?.roles.includes(userRole) ?? false;

  if (!roleAllows) {
    return false; // Role doesn't allow this feature
  }

  // If no features_access specified, use role-based access (legacy mode)
  if (!featuresAccess) {
    return true;
  }

  // If features_access exists, check the specific feature
  return featuresAccess[featureId] === true;
}

/**
 * Check if a user can access a specific page/route
 */
export function canAccessPage(
  pathname: string,
  userRole: UserRole,
  featuresAccess?: Record<string, boolean> | null
): boolean {
  // Find matching feature for this page
  const featureId = PAGE_FEATURE_MAP[pathname];

  // If featureId is null, it means this page is accessible to all authenticated users
  if (featureId === null) {
    return true;
  }

  // If no mapping found, allow (fallback for unmapped pages)
  if (featureId === undefined) {
    return true;
  }

  return canAccessFeature(userRole, featureId, featuresAccess);
}

/**
 * Get all features a user can access
 */
export function getUserAccessibleFeatures(
  userRole: UserRole,
  featuresAccess?: Record<string, boolean> | null
): FeatureId[] {
  const accessible: FeatureId[] = [];

  Object.keys(FEATURE_CONFIG).forEach((featureId) => {
    if (canAccessFeature(userRole, featureId as FeatureId, featuresAccess)) {
      accessible.push(featureId as FeatureId);
    }
  });

  return accessible;
}

/**
 * Merge user's features_access with defaults for their role
 * This ensures admin overrides are applied while maintaining role-based defaults
 */
export function mergeFeatureAccess(
  userRole: UserRole,
  customAccess?: Record<string, boolean> | null
): Record<string, boolean> {
  const defaults = getDefaultFeaturesForRole(userRole);

  if (!customAccess) {
    return defaults;
  }

  // Merge: custom access overrides defaults, but only for features the role supports
  const merged = { ...defaults };
  Object.entries(customAccess).forEach(([featureId, enabled]) => {
    if (featureId in FEATURE_CONFIG) {
      merged[featureId as FeatureId] = enabled;
    }
  });

  return merged;
}
