'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import { Zap } from 'lucide-react';
import { canAccessPage } from '@/lib/permissions';
import { usePermissionSync } from '@/lib/usePermissionSync';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Sync permissions every 30 seconds and when tab becomes visible
  usePermissionSync();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // Check if user has access to this page
      const userRole = user.role as 'admin' | 'faculty' | 'student';
      const featuresAccess = user.features_access || null;
      
      const canAccess = canAccessPage(pathname, userRole, featuresAccess);
      
      if (!canAccess) {
        // User doesn't have permission for this page - redirect to dashboard
        console.warn(`Access denied to ${pathname} for user ${user.email}`);
        router.push('/dashboard');
        return;
      }

      setHasAccess(true);
      setTimeout(() => setChecking(false), 300);
    } catch (err) {
      console.error('Error checking permissions:', err);
      // On error, allow access (fail gracefully) instead of blocking
      setHasAccess(true);
      setTimeout(() => setChecking(false), 300);
    }

    // Listen for permission changes from admin
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          const userRole = updatedUser.role as 'admin' | 'faculty' | 'student';
          const featuresAccess = updatedUser.features_access || null;
          const canAccessUpdated = canAccessPage(pathname, userRole, featuresAccess);
          
          if (!canAccessUpdated) {
            console.warn(`Permission revoked for ${pathname}`);
            toast.error('Your access to this page has been revoked. Redirecting...');
            setTimeout(() => router.push('/dashboard'), 1000);
          }
        } catch (err) {
          console.error('Error checking updated permissions:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname, router]);

  if (checking || !hasAccess) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(59,130,246,0.4)',
            }}
          >
            <Zap size={24} color="white" />
          </motion.div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#f0f4ff', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
              {hasAccess ? 'Loading Dashboard' : 'Checking Access'}
            </p>
            <p style={{ color: '#475569', fontSize: '13px' }}>
              {hasAccess ? 'Preparing your control center...' : 'Verifying permissions...'}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--bg-primary)',
          minWidth: 0,
        }}
      >
        {children}
      </motion.main>
    </div>
  );
}
