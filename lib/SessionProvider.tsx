'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSessionRefresh } from './useSessionRefresh';
import { validateSession, clearAuthData } from './tokenUtils';

interface SessionContextType {
  isSessionValid: boolean;
  isLoading: boolean;
  refreshSession: () => Promise<boolean>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshToken, checkAndRefreshToken } = useSessionRefresh(true);

  // Validate session on mount and when returning to tab
  useEffect(() => {
    const validateAndInitialize = async () => {
      console.log('🔐 SessionProvider: Validating session...');
      
      const isValid = validateSession();
      
      if (isValid) {
        setIsSessionValid(true);
        console.log('✅ SessionProvider: Session is valid');
        
        // Do an immediate check to refresh if needed
        await checkAndRefreshToken();
      } else {
        console.log('❌ SessionProvider: Session is invalid');
        
        // Don't clear auth data yet, let the page handle redirect
        if (pathname !== '/login') {
          setIsSessionValid(false);
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/login');
          }, 500);
        }
      }
      
      setIsLoading(false);
    };

    validateAndInitialize();

    // Handle storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (e.newValue) {
          console.log('📱 SessionProvider: Access token updated from another tab');
          setIsSessionValid(true);
        } else {
          console.log('📱 SessionProvider: Access token cleared from another tab');
          setIsSessionValid(false);
          if (pathname !== '/login') {
            router.push('/login');
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname, router, checkAndRefreshToken]);

  return (
    <SessionContext.Provider
      value={{
        isSessionValid,
        isLoading,
        refreshSession: refreshToken,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
