'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Zap, Shield, BarChart3 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      if (!['admin', 'super_admin'].includes(data.user?.role)) {
        throw new Error('Access denied. Admin role required.');
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

  const features = [
    { icon: BarChart3, label: 'Real-time Analytics', desc: 'Monitor system performance' },
    { icon: Shield, label: 'Secure Management', desc: 'JWT-protected endpoints' },
    { icon: Zap, label: 'AI-Powered', desc: 'LLM integration & monitoring' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', zIndex: 1 }}>
      {/* Left Panel */}
      <div style={{
        flex: '0 0 45%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
        background: 'linear-gradient(145deg, rgba(17,24,39,0.98), rgba(7,11,20,0.99))',
        borderRight: '1px solid rgba(99,179,237,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-100px', left: '-100px',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-100px',
          width: '350px', height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ marginBottom: '60px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59,130,246,0.4)',
            }}>
              <Zap size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                Campus<span className="gradient-text">GPT</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Admin Console
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{
            fontSize: '40px', fontWeight: '900',
            lineHeight: '1.15', letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}>
            Welcome to the<br />
            <span className="gradient-text">Control Center</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', marginBottom: '48px', maxWidth: '320px' }}>
            Manage documents, monitor AI interactions, and control your CampusGPT system from one powerful dashboard.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  animationDelay: `${i * 0.1}s`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
                  transition: `all 0.4s ease ${i * 0.1}s`,
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={18} color="#60a5fa" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#f0f4ff' }}>{f.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom version */}
        <div style={{ fontSize: '12px', color: '#334155', position: 'relative', zIndex: 1 }}>
          CampusGPT v2.0 • Production Ready
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: 'rgba(7, 11, 20, 0.6)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          width: '100%', maxWidth: '420px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s ease',
        }}>
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Sign in
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Enter your admin credentials to access the panel
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@campusgpt.com"
                  required
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="input-field"
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    cursor: 'pointer', color: '#64748b', padding: 0,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%', padding: '14px',
                fontSize: '15px', fontWeight: '700',
                marginTop: '4px',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Sign in to Dashboard
                </>
              )}
            </button>
          </form>

          {/* Demo credentials notice */}
          <div style={{
            marginTop: '28px',
            padding: '14px 16px',
            background: 'rgba(96,165,250,0.05)',
            border: '1px solid rgba(96,165,250,0.12)',
            borderRadius: '10px',
          }}>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
              <span style={{ color: '#60a5fa', fontWeight: '600' }}>Admin access required.</span>
              {' '}Only users with admin or super_admin role can access this panel. Contact your system administrator for credentials.
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
