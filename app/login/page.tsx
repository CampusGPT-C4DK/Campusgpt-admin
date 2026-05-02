'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Zap, Shield, BarChart3, ArrowRight, Brain, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { validateSession, isTokenExpired } from '@/lib/tokenUtils';

/* ─── AURORA MESH ─── */
function AuroraMesh() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-10%', left: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 65%)',
          filter: 'blur(60px)',
        }}
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: '-15%', right: '-5%',
          width: '450px', height: '450px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.06), transparent 65%)',
          filter: 'blur(80px)',
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.04), transparent)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
}

/* ─── FLOATING DASHBOARD CARD ─── */
function FloatingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: 2 }}
      transition={{ duration: 0.8, delay: 0.8 }}
      style={{
        width: '280px', padding: '20px', borderRadius: '16px',
        background: 'linear-gradient(145deg, rgba(23,28,37,0.9), rgba(15,19,29,0.95))',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(96,165,250,0.05)',
        transform: 'rotate(2deg)',
      }}
    >
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '12px' }}>Live Stats</div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
        {[
          { val: '1.2K', label: 'Docs', color: '#60a5fa' },
          { val: '89%', label: 'Acc', color: '#34d399' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: `${s.color}08`, border: `1px solid ${s.color}12` }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '9px', color: '#475569' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '40px' }}>
        {[30, 55, 40, 70, 50, 80, 60].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.5, delay: 1.2 + i * 0.08 }}
            style={{ flex: 1, borderRadius: '3px', backgroundImage: 'linear-gradient(to top, #3b82f6, #7c3aed)', opacity: 0.7 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ═════════════════════════ MAIN LOGIN ═════════════════════════ */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    // Check if user already has valid session stored
    const checkExistingSession = async () => {
      const token = localStorage.getItem('access_token');
      const user = localStorage.getItem('user');

      if (token && user) {
        try {
          // If token is not expired, redirect to dashboard
          if (!isTokenExpired(token, 300)) {
            console.log('✅ Login: Valid session found, redirecting to dashboard');
            router.push('/dashboard');
            return;
          }

          // Token might be expired, try to refresh it
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            console.log('🔄 Login: Token expired but refresh token available, attempting refresh...');
            
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const res = await fetch(`${backendUrl}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (res.ok) {
              const data = await res.json();
              localStorage.setItem('access_token', data.access_token);
              localStorage.setItem('refresh_token', data.refresh_token || refreshToken);
              if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
              }
              console.log('✅ Login: Token refreshed, redirecting to dashboard');
              router.push('/dashboard');
              return;
            }
          }

          // Refresh failed, clear stored session
          console.log('❌ Login: Stored session invalid, clearing...');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        } catch (error) {
          console.error('Error checking existing session:', error);
          // Continue to show login form
        }
      }
    };

    checkExistingSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Login failed');

      if (!['admin', 'faculty', 'super_admin'].includes(data.user?.role)) {
        throw new Error('Access denied. Admin or Faculty role required.');
      }

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token || '');
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success(`Welcome back, ${data.user.full_name || 'Admin'}! 👋`);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const featurePills = [
    { icon: BarChart3, label: 'Real-time Analytics' },
    { icon: Shield, label: 'Enterprise Security' },
    { icon: Sparkles, label: 'AI-Powered Engine' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', zIndex: 1 }}>

      {/* ═══ LEFT PANEL ═══ */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          flex: '0 0 50%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '56px 52px',
          background: 'linear-gradient(160deg, rgba(15,19,29,0.99), rgba(10,14,23,1))',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <AuroraMesh />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(96,165,250,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.018) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 75%)',
        }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ marginBottom: '56px', position: 'relative', zIndex: 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '14px',
              backgroundColor: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 28px rgba(59,130,246,0.4)',
              overflow: 'hidden',
              border: '1px solid rgba(59,130,246,0.2)',
            }}>
              <img src="/campusgpt-logo.png" alt="CampusGPT" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                Campus<span className="gradient-text">GPT</span>
              </div>
              <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '600' }}>
                Admin Console
              </div>
            </div>
          </div>
        </motion.div>

        {/* Heading */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
            <h1 style={{ fontSize: '42px', fontWeight: '900', lineHeight: '1.08', letterSpacing: '-0.04em', marginBottom: '18px' }}>
              Welcome to the{' '}
              <span style={{
                display: 'block',
                backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #22d3ee 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Intelligence Hub
              </span>
            </h1>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.7', marginBottom: '36px', maxWidth: '360px' }}>
              Manage documents, monitor AI interactions, and control your CampusGPT system from one powerful dashboard.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}
          >
            {featurePills.map((f, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '8px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                fontSize: '12px', fontWeight: '600', color: '#94a3b8',
              }}>
                <f.icon size={13} color="#60a5fa" /> {f.label}
              </div>
            ))}
          </motion.div>

          {/* Floating dashboard card */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <FloatingCard />
          </motion.div>
        </div>

        {/* Version */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          style={{ fontSize: '11px', color: '#334155', position: 'relative', zIndex: 1 }}>
          CampusGPT v2.0 • Production Ready
        </motion.div>
      </motion.div>

      {/* ═══ RIGHT PANEL — LOGIN FORM ═══ */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px',
          background: 'rgba(10,14,23,0.6)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
        }}
      >
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', top: '25%', right: '25%',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.035), transparent)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          {/* Heading */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              Sign{' '}
              <span style={{
                backgroundImage: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>in</span>
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Enter your admin credentials to access the panel</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: focusedField === 'email' ? '#60a5fa' : '#94a3b8',
                marginBottom: '8px', transition: 'color 0.2s', letterSpacing: '0.03em',
              }}>Email Address</label>
              <div style={{
                position: 'relative', borderRadius: '12px',
                backgroundColor: focusedField === 'email' ? 'rgba(96,165,250,0.04)' : 'rgba(10,14,23,0.8)',
                borderWidth: '1px', borderStyle: 'solid',
                borderColor: focusedField === 'email' ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.06)',
                boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(96,165,250,0.07)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                <Mail size={15} style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: focusedField === 'email' ? '#60a5fa' : '#475569', pointerEvents: 'none', transition: 'color 0.2s',
                }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                  placeholder="admin@campusgpt.com" required
                  style={{
                    width: '100%', padding: '13px 14px 13px 42px',
                    background: 'transparent', border: 'none', outline: 'none',
                    color: '#f0f4ff', fontSize: '14px', fontFamily: 'Inter, sans-serif', borderRadius: '12px',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{
                  fontSize: '12px', fontWeight: '600',
                  color: focusedField === 'password' ? '#60a5fa' : '#94a3b8',
                  transition: 'color 0.2s', letterSpacing: '0.03em',
                }}>Password</label>
                <a href="#" style={{ fontSize: '12px', color: '#22d3ee', textDecoration: 'none', fontWeight: '500' }}
                   onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                   onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                  Forgot password?
                </a>
              </div>
              <div style={{
                position: 'relative', borderRadius: '12px',
                backgroundColor: focusedField === 'password' ? 'rgba(96,165,250,0.04)' : 'rgba(10,14,23,0.8)',
                borderWidth: '1px', borderStyle: 'solid',
                borderColor: focusedField === 'password' ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.06)',
                boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(96,165,250,0.07)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                <Lock size={15} style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: focusedField === 'password' ? '#60a5fa' : '#475569', pointerEvents: 'none', transition: 'color 0.2s',
                }} />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                  placeholder="••••••••••" required
                  style={{
                    width: '100%', padding: '13px 48px 13px 42px',
                    background: 'transparent', border: 'none', outline: 'none',
                    color: '#f0f4ff', fontSize: '14px', fontFamily: 'Inter, sans-serif', borderRadius: '12px',
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
                    display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              style={{
                width: '100%', padding: '15px', fontSize: '15px', fontWeight: '700', marginTop: '6px',
                backgroundColor: loading ? 'rgba(59,130,246,0.5)' : undefined,
                backgroundImage: loading ? 'none' : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #7c3aed 100%)',
                color: 'white', borderWidth: 0, borderStyle: 'none',
                borderRadius: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: loading ? 'none' : '0 8px 32px rgba(59,130,246,0.3)',
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: '17px', height: '17px',
                      borderWidth: '2px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                    }}
                  />
                  Signing in...
                </>
              ) : (
                <>Sign in to Dashboard <ArrowRight size={15} /></>
              )}
            </motion.button>
          </form>

          {/* Admin notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }}
            style={{
              marginTop: '28px', padding: '14px 16px',
              backgroundColor: 'rgba(96,165,250,0.04)',
              borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(96,165,250,0.1)',
              borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}
          >
            <Shield size={15} color="#60a5fa" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.7' }}>
              <span style={{ color: '#60a5fa', fontWeight: '700' }}>Admin access required.</span>{' '}
              Only users with admin or super_admin role can access this panel.
            </div>
          </motion.div>

          {/* Back */}
          <div style={{ textAlign: 'center', marginTop: '22px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none', border: 'none', color: '#475569',
                fontSize: '13px', cursor: 'pointer', transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#60a5fa')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              ← Back to home
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
