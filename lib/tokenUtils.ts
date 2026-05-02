/**
 * Token Management Utilities
 * Handles token expiration, refresh, and validation
 */

export interface TokenPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: any;
}

/**
 * Decode JWT token (without verification) to extract payload
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * Returns true if token is expired or will expire in the next 5 minutes (buffer)
 */
export const isTokenExpired = (token: string | null, bufferSeconds = 300): boolean => {
  if (!token) return true;
  
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeUntilExpiry = expirationTime - currentTime;
  
  // Token is expired or will expire in buffer time (5 minutes)
  return timeUntilExpiry < bufferSeconds * 1000;
};

/**
 * Get time remaining until token expiry in milliseconds
 */
export const getTokenExpiryTime = (token: string | null): number => {
  if (!token) return 0;
  
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return 0;
  
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  return Math.max(0, expirationTime - currentTime);
};

/**
 * Schedule token refresh before expiration
 * Calls the callback when it's time to refresh (5 minutes before expiry)
 */
export const scheduleTokenRefresh = (
  token: string | null,
  onRefresh: () => void
): (() => void) => {
  if (!token) return () => {};
  
  const timeUntilRefresh = getTokenExpiryTime(token) - 5 * 60 * 1000; // Refresh 5 minutes before expiry
  
  if (timeUntilRefresh <= 0) {
    // Token already expiring soon, schedule refresh for now
    onRefresh();
    return () => {};
  }
  
  const timeoutId = setTimeout(onRefresh, timeUntilRefresh);
  
  // Return cleanup function
  return () => clearTimeout(timeoutId);
};

/**
 * Validate if user has a valid session
 */
export const validateSession = (): boolean => {
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const user = localStorage.getItem('user');
  
  // Must have all three components
  if (!token || !refreshToken || !user) return false;
  
  // Token must not be expired (with 5 minute buffer)
  if (isTokenExpired(token, 300)) return false;
  
  try {
    JSON.parse(user);
    return true;
  } catch {
    return false;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};
