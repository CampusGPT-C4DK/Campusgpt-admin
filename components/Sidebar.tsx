'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, MessageSquare, Users, Settings,
  LogOut, Menu, X, Zap, ChevronRight,
  Bell, Search, Bot,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText },
  { label: 'AI Chat', href: '/dashboard/chat', icon: Bot, badge: 'New' },
  { label: 'Chat History', href: '/dashboard/chats', icon: MessageSquare },
  { label: 'Users', href: '/dashboard/users', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside style={{
      width: collapsed ? '72px' : '248px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, rgba(13,20,36,0.98) 0%, rgba(7,11,20,0.99) 100%)',
      borderRight: '1px solid rgba(99,179,237,0.07)',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Header */}
      <div style={{
        padding: collapsed ? '20px 14px' : '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        minHeight: '72px',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px rgba(59,130,246,0.3)',
            }}>
              <Zap size={18} color="white" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                Campus<span style={{
                  background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>GPT</span>
              </div>
              <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Admin
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59,130,246,0.3)',
          }}>
            <Zap size={18} color="white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', width: '28px', height: '28px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: '#64748b', flexShrink: 0, transition: 'all 0.2s ease',
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <X size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {!collapsed && (
          <div style={{
            fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em',
            color: '#334155', textTransform: 'uppercase', padding: '0 8px',
            marginBottom: '8px',
          }}>
            Navigation
          </div>
        )}

        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
            style={{
              width: '100%', border: 'none', textAlign: 'left',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ fontSize: '14px', fontWeight: '500', flex: 1 }}>{item.label}</span>
            )}
            {!collapsed && item.badge && (
              <span style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(96,165,250,0.15))',
                color: '#a78bfa',
                border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: '6px', padding: '2px 7px', fontSize: '10px', fontWeight: '700',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User section */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        {!collapsed && user && (
          <div style={{
            padding: '10px 12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0,
              }}>
                {user.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.full_name || 'Admin'}
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{
            width: '100%', border: 'none', color: '#f87171',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
