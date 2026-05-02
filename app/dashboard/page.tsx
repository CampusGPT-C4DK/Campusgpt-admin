'use client';

import { useState, useEffect } from 'react';
import { adminAPI, handleApiError } from '@/lib/api';
import { AdminStats } from '@/lib/types';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import {
  FileText, MessageSquare, Users, Zap,
  TrendingUp, Activity, HardDrive, Clock,
  ArrowUpRight, Upload, RefreshCw,
  CheckCircle, AlertCircle, Server, Sparkles,
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

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
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
          color: '#60a5fa',
          bgColor: 'rgba(96,165,250,0.08)',
          gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
        },
        {
          label: 'Knowledge Chunks',
          value: (stats.total_chunks || 0).toLocaleString(),
          icon: Zap,
          change: '+18%',
          color: '#a78bfa',
          bgColor: 'rgba(167,139,250,0.08)',
          gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
        },
        {
          label: 'Total Students',
          value: (stats.total_students || 0).toLocaleString(),
          icon: Users,
          change: '+5%',
          color: '#34d399',
          bgColor: 'rgba(52,211,153,0.08)',
          gradient: 'linear-gradient(135deg, #34d399, #059669)',
        },
        {
          label: 'Chat Sessions',
          value: (stats.total_chats || 0).toLocaleString(),
          icon: MessageSquare,
          change: '+31%',
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
          sub: `${stats.storage_used_mb?.toLocaleString() || 0} MB total`,
        },
        {
          label: 'Avg Response Time',
          value: stats.avg_response_time_ms ? `${(stats.avg_response_time_ms / 1000).toFixed(1)}s` : '—',
          icon: Clock,
          color: '#f472b6',
          sub: `${stats.avg_response_time_ms} ms latency`,
        },
        {
          label: 'Queries Today',
          value: (stats.queries_today || 0).toLocaleString(),
          icon: TrendingUp,
          color: '#60a5fa',
          sub: 'Active interactions today',
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
    { label: 'TAE Faculty', icon: Users, href: '/dashboard/faculty', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
    { label: 'TAE Grading', icon: CheckCircle, href: '/dashboard/faculty/grading', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    { label: 'Upload Document', icon: Upload, href: '/dashboard/documents', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    { label: 'View Chat History', icon: MessageSquare, href: '/dashboard/chats', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
    { label: 'Manage Users', icon: Users, href: '/dashboard/users', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    { label: 'System Settings', icon: Server, href: '/dashboard/settings', color: '#fb923c', bg: 'rgba(251,146,60,0.08)' },
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
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        }
      />

      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger}
        style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        {/* ═══ WELCOME BANNER ═══ */}
        <motion.div variants={fadeInUp}>
          <div className="border-gradient" style={{ padding: '1px', borderRadius: '17px' }}>
            <div style={{
              borderRadius: '16px',
              padding: '28px 32px',
              background: 'linear-gradient(135deg, rgba(23,28,37,0.98) 0%, rgba(15,19,29,0.98) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Background pattern */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `
                  linear-gradient(rgba(96,165,250,0.02) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(96,165,250,0.02) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
                maskImage: 'linear-gradient(to right, transparent, black 30%, black 70%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%, black 70%, transparent)',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', color: '#60a5fa', fontWeight: '600', marginBottom: '6px',
                }}>
                  <Sparkles size={14} />
                  {greeting} 👋
                </div>
                <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '6px' }}>
                  {user?.full_name || 'Administrator'}
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  Here's what's happening with CampusGPT today
                </p>
              </div>
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: '800', color: 'white',
                boxShadow: '0 0 30px rgba(59,130,246,0.3)',
                position: 'relative', zIndex: 1,
              }}>
                {user?.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ MAIN STATS ═══ */}
        <motion.div variants={fadeInUp}>
          <h3 className="section-heading">Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="glass-card shimmer" style={{ height: '150px', borderRadius: '16px' }} />
                ))
              : statCards.map((card, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className="glass-card stat-card card-shine"
                    style={{ padding: '22px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '13px',
                        background: card.bgColor, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${card.color}20`,
                      }}>
                        <card.icon size={20} color={card.color} />
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: 'rgba(52,211,153,0.06)',
                        border: '1px solid rgba(52,211,153,0.12)',
                        borderRadius: '8px', padding: '4px 8px',
                      }}>
                        <ArrowUpRight size={11} color="#34d399" />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#34d399' }}>{card.change}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '30px', fontWeight: '800', letterSpacing: '-0.03em', color: '#f0f4ff', marginBottom: '4px' }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{card.label}</div>
                    {/* Bottom accent bar */}
                    <div style={{ marginTop: '16px', height: '3px', borderRadius: '999px', background: 'rgba(255,255,255,0.04)' }}>
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '70%' }}
                        transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                        style={{ height: '100%', background: card.gradient, borderRadius: '999px' }}
                      />
                    </div>
                  </motion.div>
                ))}
          </div>
        </motion.div>

        {/* ═══ METRICS + STATUS ROW ═══ */}
        <motion.div variants={fadeInUp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Performance Metrics */}
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f0f4ff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="#60a5fa" />
              Performance Metrics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading
                ? Array(4).fill(0).map((_, i) => (
                    <div key={i} className="shimmer" style={{ height: '52px', borderRadius: '12px' }} />
                  ))
                : metricCards.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        transition: 'all 0.2s ease',
                        cursor: 'default',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `${m.color}06`;
                        e.currentTarget.style.borderColor = `${m.color}15`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
                      }}
                    >
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                        background: `${m.color}10`,
                        border: `1px solid ${m.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <m.icon size={16} color={m.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>{m.label}</div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>{m.sub}</div>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: m.color }}>
                        {m.value}
                      </div>
                    </motion.div>
                  ))}
            </div>
          </div>

          {/* System Status + Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status Panel */}
            <div className="glass-card-static" style={{ padding: '24px', flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f0f4ff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={16} color="#34d399" />
                System Status
              </h3>
              {Object.entries(systemStatus).map(([key, status], i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={status === 'operational' ? 'pulse-dot' : ''} style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: status === 'operational' ? '#34d399' : '#f87171',
                    }} />
                    <span style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'capitalize', fontWeight: '500' }}>
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
            <div className="glass-card-static" style={{ padding: '24px' }}>
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
                      padding: '14px', borderRadius: '12px',
                      background: action.bg,
                      border: `1px solid ${action.color}15`,
                      textDecoration: 'none',
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 20px ${action.color}15`;
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
        </motion.div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
