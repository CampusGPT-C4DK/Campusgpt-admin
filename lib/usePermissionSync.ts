'use client';

import { useEffect, useRef, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { toast } from 'react-toastify';

/**
 * Hook to periodically sync user permissions from the backend
 * Ensures permissions are always up-to-date even if changed by admin in another window
 */
export function usePermissionSync() {
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);

  const syncPermissions = useCallback(async () => {
    try {
      const user = localStorage.getItem('user');
      if (!user) return;

      const parsedUser = JSON.parse(user);
      
      // Don't sync more than once per 10 seconds
      const now = Date.now();
      if (now - lastSyncRef.current < 10000) return;
      lastSyncRef.current = now;

      // Fetch current permissions from backend
      const accessData = await adminAPI.getUserAccess(parsedUser.id);
      
      // Check if permissions changed
      const currentFeatures = parsedUser.features_access || {};
      const newFeatures = accessData.features || {};
      
      // Compare and update if different
      const hasChanged = JSON.stringify(currentFeatures) !== JSON.stringify(newFeatures);
      
      if (hasChanged) {
        console.log('🔄 Permission sync: Detected changes, updating...', {
          old: currentFeatures,
          new: newFeatures,
        });
        
        parsedUser.features_access = newFeatures;
        localStorage.setItem('user', JSON.stringify(parsedUser));
        
        // Dispatch storage event to notify all components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'user',
          newValue: JSON.stringify(parsedUser),
          oldValue: user,
          storageArea: localStorage,
          url: window.location.href,
        }));
        
        console.log('✅ Permissions updated and synced to all components');
      }
    } catch (err) {
      // Silent fail - don't spam user with errors
      console.debug('Permission sync error (silent):', err);
    }
  }, []);

  // Start periodic sync on mount
  useEffect(() => {
    // Sync immediately on mount
    syncPermissions();
    
    // Then sync every 30 seconds
    syncIntervalRef.current = setInterval(syncPermissions, 30000);

    // Also sync when page visibility changes (when user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page visible, syncing permissions...');
        syncPermissions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncPermissions]);

  return { syncPermissions };
}
