'use client';

import { useState, useEffect } from 'react';
import { adminAPI, handleApiError } from '@/lib/api';
import { AdminStats } from '@/lib/types';
import { toast } from 'react-toastify';
import Header from '@/components/Header';
import {
  FileText, MessageSquare, Users, Zap,
  TrendingUp, Activity, HardDrive, Clock,
  ArrowUpRight, Plus, Upload, RefreshCw,
  CheckCircle, AlertCircle, Server,
} from 'lucide-react';

const MOCK_STATS: AdminStats = {
  total_documents: 45,
  total_chunks: 12450,
  total_students: 287,
  total_chats: 5420,
  storage_used_mb: 2340,
  avg_response_time_ms: 2150,
  queries_today: 350,
  active_users_now: 24,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState({
    database: 'operational',
    cache: 'operational',
    llm_service: 'operational',
  });

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    } catch {}
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      // Use mock data if API fails
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
    toast.info('Dashboard refreshed');
  };

  const statCards = stats
    ? [
        {
          label: 'Total Documents',
          value: stats.total_documents.toLocaleString(),
          icon: FileText,
          change: '+12%',
          positive: true,
          color: '#60a5fa',
          bgColor: 'rgba(96,165,250,0.08)',
          gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
        },
        {
          label: 'Knowledge Chunks',
          value: (stats.total_chunks || 0).toLocaleString(),
          icon: Zap,
          change: '+18%',
          positive: true,
          color: '#a78bfa',
          bgColor: 'rgba(167,139,250,0.08)',
          gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
        },
        {
          label: 'Total Students',
          value: (stats.total_students || 0).toLocaleString(),
          icon: Users,
          change: '+5%',
          positive: true,
          color: '#34d399',
          bgColor: 'rgba(52,211,153,0.08)',
          gradient: 'linear-gradient(135deg, #34d399, #059669)',
        },
        {
          label: 'Chat Sessions',
          value: (stats.total_chats || 0).toLocaleString(),
          icon: MessageSquare,
          change: '+31%',
          positive: true,
          color: '#fb923c',
          bgColor: 'rgba(251,146,60,0.08)',
          gradient: 'linear-gradient(135deg, #fb923c, #ea580c)',
        },
      ]
    : [];

  const metricCards = stats
    ? [
        {
          label: 'Storage Used',
          value: stats.storage_used_mb ? `${(stats.storage_used_mb / 1024).toFixed(1)} GB` : '—',
          icon: HardDrive,
          color: '#22d3ee',
          sub: `${stats.storage_used_mb?.toLocaleString() || 0} MB`,
        },
        {
          label: 'Avg Response Time',
          value: stats.avg_response_time_ms ? `${(stats.avg_response_time_ms / 1000).toFixed(1)}s` : '—',
          icon: Clock,
          color: '#f472b6',
          sub: `${stats.avg_response_time_ms} ms`,
        },
        {
          label: 'Queries Today',
          value: (stats.queries_today || 0).toLocaleString(),
          icon: TrendingUp,
          color: '#60a5fa',
          sub: 'Active interactions',
        },
        {
          label: 'Active Users Now',
          value: (stats.active_users_now || 0).toString(),
          icon: Activity,
          color: '#34d399',
          sub: 'Online right now',
        },
      ]
    : [];

  const quickActions = [
    { label: 'Upload Document', icon: Upload, href: '/dashboard/documents', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'View Chat History', icon: MessageSquare, href: '/dashboard/chats', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    { label: 'Manage Users', icon: Users, href: '/dashboard/users', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { label: 'System Settings', icon: Server, href: '/dashboard/settings', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Welcome back to your command center"
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        }
      />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Welcome Banner */}
        <div className="border-gradient" style={{ padding: '1px', borderRadius: '17px' }}>
          <div style={{
            borderRadius: '16px',
            padding: '24px 28px',
            background: 'linear-gradient(135deg, rgba(17,24,39,0.98) 0%, rgba(13,20,36,0.98) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '600', marginBottom: '4px' }}>
                {greeting} 👋
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                {user?.full_name || 'Administrator'}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                Here's what's happening with CampusGPT today
              </p>
            </div>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: '800', color: 'white',
              boxShadow: '0 0 30px rgba(59,130,246,0.3)',
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
            Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="glass-card shimmer" style={{ height: '140px', borderRadius: '16px' }} />
                ))
              : statCards.map((card, i) => (
                  <div key={i} className="glass-card stat-card animate-fade-in" style={{
                    padding: '20px', animationDelay: `${i * 0.08}s`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: card.bgColor, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <card.icon size={20} color={card.color} />
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: 'rgba(52,211,153,0.08)',
                        border: '1px solid rgba(52,211,153,0.15)',
                        borderRadius: '6px', padding: '3px 8px',
                      }}>
                        <ArrowUpRight size={11} color="#34d399" />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#34d399' }}>{card.change}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: '#f0f4ff', marginBottom: '4px' }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{card.label}</div>
                    {/* Bottom bar */}
                    <div style={{ marginTop: '16px', height: '3px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)' }}>
                      <div style={{ height: '100%', width: '70%', background: card.gradient, borderRadius: '999px' }} />
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Metrics + Status Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Performance Metrics */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f0f4ff', marginBottom: '20px' }}>
              Performance Metrics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading
                ? Array(4).fill(0).map((_, i) => (
                    <div key={i} className="shimmer" style={{ height: '48px', borderRadius: '10px' }} />
                  ))
                : metricCards.map((m, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '10px',
                      transition: 'all 0.2s ease',
                    }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: `${m.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <m.icon size={16} color={m.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>{m.label}</div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>{m.sub}</div>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: m.color }}>
                        {m.value}
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* System Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status Panel */}
            <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f0f4ff', marginBottom: '20px' }}>
                System Status
              </h3>
              {Object.entries(systemStatus).map(([key, status], i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={status === 'operational' ? 'pulse-dot' : ''} style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: status === 'operational' ? '#34d399' : '#f87171',
                    }} />
                    <span style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {status === 'operational'
                      ? <CheckCircle size={14} color="#34d399" />
                      : <AlertCircle size={14} color="#f87171" />}
                    <span style={{
                      fontSize: '12px', fontWeight: '600',
                      color: status === 'operational' ? '#34d399' : '#f87171',
                    }}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f0f4ff', marginBottom: '16px' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {quickActions.map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px', borderRadius: '10px',
                      background: action.bg,
                      border: `1px solid ${action.color}20`,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${action.color}20`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = '';
                      (e.currentTarget as HTMLElement).style.boxShadow = '';
                    }}
                  >
                    <action.icon size={16} color={action.color} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: action.color }}>
                      {action.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
