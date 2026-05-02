/**
 * useSessionRefresh Hook
 * Automatically refreshes user session in the background
 * Runs on component mount and periodically
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenExpired } from './tokenUtils';

const REFRESH_CHECK_INTERVAL = 30000; // Check every 30 seconds
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export const useSessionRefresh = (enabled = true) => {
  const router = useRouter();
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Prevent multiple concurrent refresh requests
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshTokenValue = localStorage.getItem('refresh_token');
    
    if (!refreshTokenValue) {
      console.warn('❌ useSessionRefresh: No refresh token available');
      return false;
    }

    refreshPromiseRef.current = (async () => {
      try {
        console.log('🔄 useSessionRefresh: Attempting to refresh token...');
        
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshTokenValue }),
        });

        if (!response.ok) {
          console.error(`❌ useSessionRefresh: Refresh failed with status ${response.status}`);
          
          // If refresh fails, clear auth and redirect
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          router.push('/login');
          return false;
        }

        const data = await response.json();
        
        if (data.access_token && data.refresh_token) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Dispatch storage event to notify other tabs/components
            window.dispatchEvent(
              new StorageEvent('storage', {
                key: 'access_token',
                newValue: data.access_token,
                storageArea: localStorage,
              })
            );
          }
          
          console.log('✅ useSessionRefresh: Token refreshed successfully');
          return true;
        } else {
          console.error('❌ useSessionRefresh: No tokens in refresh response');
          return false;
        }
      } catch (error) {
        console.error('❌ useSessionRefresh: Refresh error -', error);
        return false;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [router]);

  const checkAndRefreshToken = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      console.debug('useSessionRefresh: No access token found');
      return;
    }

    // Check if token is expired (with 5 minute buffer)
    if (isTokenExpired(accessToken, 300)) {
      console.log('⚠️ useSessionRefresh: Token is about to expire, refreshing...');
      await refreshToken();
    }
  }, [refreshToken]);

  useEffect(() => {
    if (!enabled) {
      console.debug('useSessionRefresh: Disabled');
      return;
    }

    console.log('✅ useSessionRefresh: Initializing session refresh hook');

    // Initial check on mount
    checkAndRefreshToken();

    // Set up periodic checks
    checkIntervalRef.current = setInterval(() => {
      checkAndRefreshToken();
    }, REFRESH_CHECK_INTERVAL);

    // Handle page visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 useSessionRefresh: Tab became visible, checking session...');
        checkAndRefreshToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle window beforeunload to save session state
    const handleBeforeUnload = () => {
      console.log('🚪 useSessionRefresh: Page unloading, session data saved to localStorage');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('🧹 useSessionRefresh: Cleaning up...');
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, checkAndRefreshToken]);

  return { refreshToken, checkAndRefreshToken };
};
