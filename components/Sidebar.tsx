'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, MessageSquare, Users, Settings,
  LogOut, Zap, ChevronLeft, ChevronRight, Bot, Crown,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { canAccessPage, PAGE_FEATURE_MAP } from '@/lib/permissions';
import { usePermissionSync } from '@/lib/usePermissionSync';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  section?: string;
  featureId?: string; // Feature ID for permission checking
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'MAIN MENU', featureId: 'admin_dashboard' },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText, featureId: 'documents' },
  { label: 'AI Chat', href: '/dashboard/chat', icon: Bot, badge: 'Live', badgeColor: '#53ddfc', featureId: 'chat' },
  { label: 'Chat History', href: '/dashboard/chats', icon: MessageSquare, featureId: 'history' },
  { label: 'Users', href: '/dashboard/users', icon: Users, section: 'SYSTEM', featureId: 'user_management' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, featureId: 'settings' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Sync permissions every 30 seconds and when tab becomes visible
  usePermissionSync();

  // Load user on mount - important for feature-based filtering
  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };

    loadUser();
    setMounted(true);

    // Listen for storage changes (when admin updates current user's permissions)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          setUser(updatedUser);
          console.log('✅ Sidebar: User permissions updated', updatedUser.features_access);
        } catch (err) {
          console.error('Error parsing updated user:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (href: string) => (href === '/dashboard' ? pathname === '/dashboard' : pathname === href || pathname.startsWith(href + '/'));

  // Filter nav items based on user permissions (features_access + role)
  const filteredNavItems = navItems.filter(item => {
    // If user not loaded yet, show nothing to avoid flash of unauthorized items
    if (!mounted || !user) return false;
    
    // Check if user can access this page based on their role and features_access
    const userRole = user.role as 'admin' | 'faculty' | 'student';
    const featuresAccess = user.features_access || null;
    
    return canAccessPage(item.href, userRole, featuresAccess);
  });

  let currentSection = '';

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 270 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} // Spring-like easing
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        backgroundColor: '#060e20', // From "Aetheric Noir" design system
        position: 'relative', overflow: 'hidden', flexShrink: 0, zIndex: 10,
        boxShadow: '1px 0 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Subtle ambient lighting layer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '200px', height: '200px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ═══ HEADER ═══ */}
      <div style={{
        padding: collapsed ? '24px 20px' : '28px 24px',
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
        gap: '12px', minHeight: '84px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
          <motion.div
            whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(139,92,246,0.5)' }}
            style={{
              width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
              backgroundImage: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(139,92,246,0.3)',
              cursor: 'pointer',
            }}
            onClick={() => router.push('/dashboard')}
          >
            <Zap size={20} color="white" />
          </motion.div>
          {!collapsed && (
            <motion.div initial={false} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', whiteSpace: 'nowrap', color: '#dee5ff' }}>
                Campus<span style={{ backgroundImage: 'linear-gradient(135deg, #ba9eff, #53ddfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GPT</span>
              </div>
              <div style={{ fontSize: '10px', color: '#a3aac4', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '700' }}>
                Admin Console
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating expand/collapse toggle */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        whileHover={{ scale: 1.1, backgroundColor: '#141f38' }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'absolute', top: '34px', right: '-14px',
          backgroundColor: '#0f1930', border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '50%', width: '28px', height: '28px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: '#8ab0ff', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 20, transition: 'background-color 0.2s',
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </motion.button>

      {/* ═══ NAVIGATION ═══ */}
      <nav style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        {filteredNavItems.map((item, idx) => {
          const active = isActive(item.href);
          const showSection = item.section && item.section !== currentSection;
          if (item.section) currentSection = item.section;

          return (
            <div key={item.href}>
              {/* Section label */}
              {showSection && !collapsed && (
                <div style={{
                  fontSize: '12px', fontWeight: '800', letterSpacing: '0.16em',
                  color: '#4d556b', textTransform: 'uppercase', padding: '16px 10px 8px',
                }}>
                  {item.section}
                </div>
              )}
              {showSection && collapsed && idx > 0 && (
                <div style={{ height: '0px', padding: '12px 0' }} /> // Just space when collapsed
              )}

              <motion.button
                onClick={() => router.push(item.href)}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                whileHover={{ x: collapsed ? 0 : 3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  width: '100%', border: 'none', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: collapsed ? '12px 0' : '12px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: '12px',
                  backgroundColor: active ? '#141f38' : 'transparent', // surface_container_high
                  color: active ? '#dee5ff' : '#a3aac4', // on_surface vs on_surface_variant
                  cursor: 'pointer',
                  position: 'relative',
                  fontSize: '14px', fontWeight: active ? '700' : '600',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {/* ── Active Selection Box Magic (Ethereal Engine Spec) ── */}
                {active && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    style={{
                      position: 'absolute', inset: 0, borderRadius: '12px',
                      backgroundColor: 'rgba(83, 221, 252, 0.05)', // Secondary glow wash
                      border: '1px solid rgba(83, 221, 252, 0.15)', // Shimmer ghost border
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 0 12px rgba(139,92,246,0.05)',
                      zIndex: -1,
                    }}
                  />
                )}

                {/* ── The Left Edge Accent Pill ── */}
                {active && (
                  <motion.div
                    layoutId="sidebarLeftLine"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    style={{
                      position: 'absolute', left: '0', top: '15%', bottom: '15%', width: '4px',
                      borderRadius: '4px',
                      backgroundColor: '#53ddfc', // Secondary Custom Color
                      boxShadow: '0 0 10px rgba(83, 221, 252, 0.6)', // Neon glow
                    }}
                  />
                )}

                {/* Icon with active gradient filter */}
                <item.icon size={20} style={{
                  flexShrink: 0,
                  color: active ? '#53ddfc' : (hoveredItem === item.href ? '#dee5ff' : '#6d758c'),
                  filter: active ? 'drop-shadow(0 0 8px rgba(83,221,252,0.5))' : 'none',
                  transition: 'all 0.3s',
                }} />

                {!collapsed && (
                  <span style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    {item.label}
                  </span>
                )}

                {/* Badge rendering */}
                {!collapsed && item.badge && (
                  <div style={{
                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {/* Glowing dot for live/success states before the text as per Ethereal Engine spec */}
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      backgroundColor: item.badgeColor || '#53ddfc',
                      marginRight: '6px',
                      boxShadow: `0 0 8px ${item.badgeColor || '#53ddfc'}`,
                      animation: 'pulse-glow 2s infinite',
                    }} />
                    <span style={{
                      color: '#dee5ff', fontSize: '10px', fontWeight: '800',
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                      {item.badge}
                    </span>
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                <AnimatePresence>
                  {collapsed && hoveredItem === item.href && (
                    <motion.div
                      initial={{ opacity: 0, x: -8, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', left: 'calc(100% + 14px)', top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '8px 14px', borderRadius: '10px',
                        backgroundColor: '#192540', // surface_container_highest
                        border: '1px solid rgba(255,255,255,0.06)',
                        fontSize: '13px', fontWeight: '700', color: '#faf8ff',
                        whiteSpace: 'nowrap', zIndex: 100,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1)',
                        pointerEvents: 'none',
                      }}
                    >
                      {item.label}
                      {item.badge && (
                        <span style={{ marginLeft: '8px', color: item.badgeColor, fontSize: '10px', fontWeight: '800' }}>
                          • {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          );
        })}
      </nav>

      {/* ═══ USER PROFILE & LOGOUT ═══ */}
      <div style={{ padding: '20px 14px 24px', position: 'relative', zIndex: 1 }}>
        {!collapsed && user && (
          <motion.div
            initial={false}
            whileHover={{ backgroundColor: '#0f1930' }}
            style={{
              padding: '16px', borderRadius: '16px',
              backgroundColor: '#091328', // surface_container_low
              border: '1px solid rgba(255,255,255,0.03)',
              marginBottom: '12px', cursor: 'pointer', transition: 'background-color 0.3s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                backgroundImage: 'linear-gradient(135deg, #1f2b49, #0f1930)',
                border: '1px solid rgba(139,92,246,0.3)', // subtle violet outline
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: '800', color: '#ba9eff', flexShrink: 0,
                boxShadow: 'inset 0 0 10px rgba(139,92,246,0.1)',
              }}>
                {user.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{
                  fontSize: '14px', fontWeight: '700', color: '#dee5ff', // on_surface
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user.full_name || 'Admin'}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', color: '#ffb2b9', marginTop: '2px', fontWeight: '600',
                }}>
                  <Crown size={10} color="#ffb2b9" />
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{user.role?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Collapsed user avatar */}
        {collapsed && user && (
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', margin: '0 auto 16px',
            backgroundImage: 'linear-gradient(135deg, #1f2b49, #0f1930)',
            border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: '800', color: '#ba9eff',
            boxShadow: 'inset 0 0 10px rgba(139,92,246,0.1)',
          }}>
            {user.full_name?.[0]?.toUpperCase() || 'A'}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            width: '100%', border: 'none', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: collapsed ? '12px 0' : '12px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '12px', backgroundColor: 'transparent',
            color: hoveredItem === 'logout' ? '#ff6e84' : '#6d758c',
            cursor: 'pointer', fontSize: '14px', fontWeight: hoveredItem === 'logout' ? '700' : '600',
            fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0, filter: hoveredItem === 'logout' ? 'drop-shadow(0 0 8px rgba(255,110,132,0.5))' : 'none' }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); box-shadow: 0 0 12px currentColor; }
        }
      `}</style>
    </motion.aside>
  );
}
