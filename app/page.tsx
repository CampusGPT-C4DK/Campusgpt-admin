'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, FileText, MessageSquare, BarChart3, Users, Shield,
  ArrowRight, ChevronRight, Star, Sparkles, Brain, Layers,
  ArrowUpRight, Upload, Bot, GraduationCap, BookOpen,
  ChevronDown, Play, Globe, Cpu, Database,
} from 'lucide-react';

/* ─── DATA ─── */
const features = [
  {
    icon: FileText, title: 'Document Intelligence',
    desc: 'Upload PDFs, DOCX, and TXT files. Our AI breaks them into intelligent chunks with vector embeddings for lightning-fast retrieval.',
    color: '#60a5fa', tag: 'Core',
  },
  {
    icon: Brain, title: 'AI Chat Assistant',
    desc: 'Students ask questions in natural language. Our RAG pipeline retrieves relevant context and generates accurate, sourced answers.',
    color: '#a78bfa', tag: 'AI',
  },
  {
    icon: BarChart3, title: 'Analytics Dashboard',
    desc: 'Track document processing, chat metrics, confidence scores, and system performance in real-time with beautiful visualizations.',
    color: '#22d3ee', tag: 'Insights',
  },
  {
    icon: Users, title: 'User Management',
    desc: 'Manage students, faculty, and admin roles with fine-grained access control. Monitor active sessions and user engagement.',
    color: '#34d399', tag: 'Control',
  },
];

const steps = [
  { num: '01', icon: Upload, title: 'Upload Documents', desc: 'Drop PDFs, DOCX, or TXT files. We handle the rest.', color: '#60a5fa' },
  { num: '02', icon: Cpu, title: 'AI Processes', desc: 'Our engine chunks, embeds, and indexes everything.', color: '#a78bfa' },
  { num: '03', icon: MessageSquare, title: 'Students Ask', desc: 'Natural language Q&A with accurate, sourced answers.', color: '#22d3ee' },
];

const stats = [
  { value: '10K+', label: 'Documents Processed', icon: FileText },
  { value: '50K+', label: 'Questions Answered', icon: MessageSquare },
  { value: '99.9%', label: 'System Uptime', icon: Shield },
  { value: '500+', label: 'Active Users', icon: Users },
];

const testimonials = [
  { name: 'Dr. Sarah Wilson', role: 'Dean of Computer Science', text: 'CampusGPT has revolutionized how our students access course materials. The AI accuracy is remarkable and saves our team hours every week.', avatar: 'S' },
  { name: 'Prof. Raj Patel', role: 'Faculty Coordinator', text: 'Managing documents across departments has never been easier. The admin panel is incredibly intuitive and the analytics are invaluable.', avatar: 'R' },
  { name: 'Emily Chen', role: 'Student Representative', text: 'Getting instant, accurate answers about admissions and policies has saved students countless hours. It feels like having a personal campus guide.', avatar: 'E' },
];

const trustedBy = ['Stanford', 'MIT', 'Harvard', 'Oxford', 'IIIT', 'NIT', 'IIT Delhi', 'Cambridge'];

/* ─── PARTICLES ─── */
function Particle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      style={{
        position: 'absolute', left: x, top: y, width: size, height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,165,250,0.35), transparent)',
        pointerEvents: 'none',
      }}
      animate={{ y: [0, -30, 0], opacity: [0.15, 0.5, 0.15], scale: [1, 1.3, 1] }}
      transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ─── MINI DASHBOARD PREVIEW ─── */
function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, rotateY: -5 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ duration: 1, delay: 0.6 }}
      style={{
        width: '480px', minHeight: '340px',
        borderRadius: '20px',
        background: 'linear-gradient(145deg, rgba(23,28,37,0.95), rgba(15,19,29,0.98))',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '20px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(96,165,250,0.06)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
        <div style={{ flex: 1, height: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', marginLeft: '8px' }} />
      </div>

      {/* Stat mini cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Documents', val: '1,247', color: '#60a5fa' },
          { label: 'Queries', val: '5.2K', color: '#a78bfa' },
          { label: 'Users', val: '312', color: '#34d399' },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.15 }}
            style={{
              padding: '12px', borderRadius: '12px',
              background: `${s.color}08`, border: `1px solid ${s.color}15`,
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '800', color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart bars */}
      <div style={{
        padding: '16px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
        marginBottom: '12px',
      }}>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px', fontWeight: '600' }}>Weekly Analytics</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
          {[40, 65, 48, 80, 55, 70, 90].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.6, delay: 1.2 + i * 0.08, ease: 'easeOut' }}
              style={{
                flex: 1, borderRadius: '4px',
                backgroundImage: 'linear-gradient(to top, #3b82f6, #7c3aed)',
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      </div>

      {/* Chat preview line */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px', borderRadius: '10px',
        background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.1)',
      }}>
        <Bot size={14} color="#a78bfa" />
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>AI is processing 3 new documents...</div>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', marginLeft: 'auto' }}
        />
      </div>

      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,165,250,0.08), transparent)',
        pointerEvents: 'none',
      }}/>
    </motion.div>
  );
}

/* ═════════════════════════ MAIN PAGE ═════════════════════════ */
export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) router.push('/dashboard');
  }, [router]);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
      {/* ── BG elements ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '900px', height: '900px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.05), transparent 60%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '750px', height: '750px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.04), transparent 60%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.025), transparent)', filter: 'blur(80px)' }} />
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(96,165,250,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 10%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 10%, transparent 65%)',
        }} />
        {mounted && Array.from({ length: 15 }).map((_, i) => (
          <Particle key={i} delay={i * 0.4} x={`${8 + Math.random() * 84}%`} y={`${5 + Math.random() * 90}%`} size={3 + Math.random() * 8} />
        ))}
      </div>

      {/* ═══════ NAVBAR ═══════ */}
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed', top: '14px', left: '20px', right: '20px',
          maxWidth: '1280px', margin: '0 auto', zIndex: 100,
          padding: '12px 24px',
          background: 'rgba(15,19,29,0.78)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            backgroundColor: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59,130,246,0.35)',
            overflow: 'hidden',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            <img src="/campusgpt-logo.png" alt="CampusGPT" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.03em', color: '#f0f4ff' }}>
            Campus<span style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GPT</span>
          </span>
        </div>

        {/* Center links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {['Features', 'How it Works', 'Stats'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
               style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }}
               onMouseEnter={e => (e.currentTarget.style.color = '#f0f4ff')}
               onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
              {link}
            </a>
          ))}
        </div>

        {/* Login Button */}
        <button
          onClick={() => router.push('/login')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '9px 22px', borderRadius: '10px', border: 'none',
            backgroundImage: 'linear-gradient(135deg, #3b82f6, #6366f1, #7c3aed)',
            color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(59,130,246,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.3)'; }}
        >
          Login <ArrowRight size={14} />
        </button>
      </motion.nav>

      {/* ═══════ HERO ═══════ */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '120px 48px 80px', maxWidth: '1360px', margin: '0 auto',
        gap: '56px', position: 'relative', zIndex: 1,
      }}>
        <div style={{ flex: '1 1 55%' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '7px 16px', borderRadius: '999px',
              background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.14)',
              marginBottom: '28px', fontSize: '12px', color: '#60a5fa', fontWeight: '600',
            }}>
              <Sparkles size={13} /> AI-Powered Campus Intelligence Platform
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{ fontSize: 'clamp(38px, 5vw, 64px)', fontWeight: '900', lineHeight: '1.08', letterSpacing: '-0.04em', marginBottom: '22px' }}
          >
            Your Campus,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 40%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Powered by AI
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
            style={{ fontSize: '17px', color: '#94a3b8', lineHeight: '1.7', maxWidth: '500px', marginBottom: '36px' }}
          >
            Transform your campus with intelligent document management, AI-powered Q&A, and real-time analytics. Built for modern educational institutions.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}
            style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}
          >
            <button
              onClick={() => router.push('/login')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '15px 30px', borderRadius: '13px',
                backgroundImage: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                color: 'white', border: 'none', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(59,130,246,0.45), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.1)'; }}
            >
              Get Started <ArrowRight size={17} />
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '15px 30px', borderRadius: '13px',
                background: 'rgba(255,255,255,0.04)', color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.08)', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <Play size={15} /> Watch Demo
            </button>
          </motion.div>
        </div>

        {/* Right: Dashboard Preview */}
        <div style={{ flex: '1 1 45%', display: 'flex', justifyContent: 'flex-end' }}>
          <DashboardPreview />
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scroll</span>
          <ChevronDown size={16} color="#475569" />
        </motion.div>
      </section>

      {/* ═══════ TRUSTED BY ═══════ */}
      <section style={{ padding: '24px 0', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{
          padding: '20px 0',
          background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '600', marginBottom: '16px' }}>
            Trusted by leading institutions
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', padding: '0 32px' }}>
            {trustedBy.map((u, i) => (
              <motion.span key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ fontSize: '14px', fontWeight: '700', color: '#334155', letterSpacing: '0.04em' }}>
                {u}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section id="features" style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '999px',
              background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.14)',
              marginBottom: '18px', fontSize: '11px', color: '#a78bfa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              <Layers size={11} /> Core Capabilities
            </div>
            <h2 style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '14px' }}>
              Built for the <span className="gradient-text">Modern Academy</span>
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '520px', margin: '0 auto', lineHeight: '1.7' }}>
              A comprehensive suite of tools designed to make campus information instantly accessible through the power of AI.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  padding: '32px', borderRadius: '18px',
                  background: 'linear-gradient(145deg, rgba(23,28,37,0.85), rgba(15,19,29,0.92))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', cursor: 'default',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.35), 0 0 0 1px ${f.color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                {/* Corner glow */}
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: `radial-gradient(circle, ${f.color}0a, transparent)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '13px',
                    backgroundImage: `linear-gradient(135deg, ${f.color}18, ${f.color}08)`,
                    border: `1px solid ${f.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <f.icon size={22} color={f.color} />
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', color: f.color, letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: '6px', background: `${f.color}0a`, border: `1px solid ${f.color}18`,
                  }}>{f.tag}</span>
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#f0f4ff', marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '14px' }}>{f.desc}</p>
                <a href="#" style={{ fontSize: '13px', color: '#22d3ee', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'gap 0.2s' }}
                   onMouseEnter={e => (e.currentTarget.style.gap = '8px')}
                   onMouseLeave={e => (e.currentTarget.style.gap = '4px')}>
                  Learn more <ArrowRight size={13} />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" style={{ padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '14px' }}>
              Simple. Seamless. <span className="gradient-text">Intelligent.</span>
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '450px', margin: '0 auto', lineHeight: '1.7' }}>
              From document upload to student answers in three simple steps.
            </p>
          </motion.div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0', position: 'relative' }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', top: '50%', left: '15%', right: '15%', height: '2px',
              background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #22d3ee)', opacity: 0.2,
              transform: 'translateY(-50%)', zIndex: 0,
            }} />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }}
                style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 16px' }}
              >
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px', margin: '0 auto 18px',
                  backgroundImage: `linear-gradient(135deg, ${step.color}12, ${step.color}06)`,
                  border: `1px solid ${step.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <step.icon size={28} color={step.color} />
                  <div style={{
                    position: 'absolute', top: '-8px', right: '-8px',
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundImage: `linear-gradient(135deg, ${step.color}, ${step.color}cc)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '800', color: 'white',
                    boxShadow: `0 0 16px ${step.color}40`,
                  }}>
                    {step.num}
                  </div>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#f0f4ff', marginBottom: '6px' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section id="stats" style={{ padding: '60px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            padding: '52px', borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(17,24,39,0.96), rgba(13,20,36,0.99))',
            border: '1px solid rgba(255,255,255,0.05)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Grid pattern */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(rgba(96,165,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px', pointerEvents: 'none',
            }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', position: 'relative', zIndex: 1 }}>
              {stats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 14px',
                    backgroundImage: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(167,139,250,0.06))',
                    border: '1px solid rgba(96,165,250,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <s.icon size={22} color="#60a5fa" />
                  </div>
                  <div style={{
                    fontSize: '38px', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '6px',
                    backgroundImage: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>{s.value}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section id="testimonials" style={{ padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <motion.div {...fadeUp} style={{ marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '999px',
              background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.14)',
              marginBottom: '18px', fontSize: '11px', color: '#34d399', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              <Star size={11} /> Voices of the Community
            </div>
            <h2 style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-0.03em' }}>
              Trusted by <span className="gradient-text">Educators</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                style={{
                  padding: '28px', borderRadius: '18px',
                  background: 'linear-gradient(145deg, rgba(23,28,37,0.85), rgba(15,19,29,0.92))',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', gap: '3px', marginBottom: '16px' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} color="#fbbf24" fill="#fbbf24" />)}
                </div>
                <p style={{ fontSize: '14px', color: '#c1c7d3', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundImage: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: '700', color: 'white',
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section style={{ padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <motion.div {...fadeUp}>
            <div className="border-gradient" style={{ padding: '1px', borderRadius: '23px' }}>
              <div style={{
                padding: '56px 48px', borderRadius: '22px', textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(23,28,37,0.98), rgba(15,19,29,0.99))',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.1), transparent)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.06), transparent)', pointerEvents: 'none' }} />
                <h2 style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                  Ready to Transform Your Campus?
                </h2>
                <p style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '32px', maxWidth: '460px', margin: '0 auto 32px', lineHeight: '1.7', position: 'relative', zIndex: 1 }}>
                  Access the admin panel to manage documents, monitor AI interactions, and control your entire CampusGPT system.
                </p>
                <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                  <button onClick={() => router.push('/login')} className="btn-primary" style={{ padding: '14px 36px', fontSize: '15px', borderRadius: '13px' }}>
                    Get Started <ArrowUpRight size={16} />
                  </button>
                  <button onClick={() => router.push('/login')} className="btn-secondary" style={{ padding: '14px 28px', fontSize: '15px', borderRadius: '13px' }}>
                    Admin Access
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #60a5fa, #a78bfa, #22d3ee, transparent)', opacity: 0.35 }} />
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 32px',
          display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '40px',
        }}>
          {/* Col 1 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(59,130,246,0.2)' }}>
                <img src="/campusgpt-logo.png" alt="CampusGPT" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: '700' }}>Campus<span className="gradient-text">GPT</span></span>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', maxWidth: '280px' }}>
              AI-powered campus intelligence platform. Making education smarter, one question at a time.
            </p>
          </div>
          {/* Col 2 */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Quick Links</h4>
            {['Features', 'How it Works', 'Stats', 'Admin Login'].map(l => (
              <a key={l} href={l === 'Admin Login' ? '/login' : `#${l.toLowerCase().replace(/\s+/g, '-')}`}
                 style={{ display: 'block', fontSize: '13px', color: '#475569', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}
                 onMouseEnter={e => (e.currentTarget.style.color = '#f0f4ff')}
                 onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>{l}</a>
            ))}
          </div>
          {/* Col 3 */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Support</h4>
            {['Documentation', 'API Reference', 'Privacy Policy', 'Terms of Service'].map(l => (
              <a key={l} href="#" style={{ display: 'block', fontSize: '13px', color: '#475569', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}
                 onMouseEnter={e => (e.currentTarget.style.color = '#f0f4ff')}
                 onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>{l}</a>
            ))}
          </div>
        </div>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: '12px', color: '#334155' }}>© 2026 CampusGPT. All rights reserved.</p>
          <p style={{ fontSize: '12px', color: '#334155' }}>Built with ❤️ and AI</p>
        </div>
      </footer>
    </div>
  );
}
