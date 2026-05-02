'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText, UploadCloud, MessageSquare, History,
  Settings, ArrowRight, BookOpen, Zap, ScrollText,
} from 'lucide-react';
import Header from '@/components/Header';
import { taeAPI, TaeFacultyDashboard } from '@/lib/taeApi';
import { toast } from 'react-toastify';

export default function FacultyDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<TaeFacultyDashboard | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        const data = await taeAPI.getFacultyDashboard();
        setStats(data);
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || 'Failed to load faculty dashboard');
      }
    };
    load();
  }, []);

  const totalAssignments = stats?.assignment_statistics?.total_assignments ?? 0;
  const pendingSubmissions = stats?.submission_statistics?.pending_submissions ?? 0;
  const totalEvaluations = stats?.evaluation_metrics?.total_evaluations ?? 0;

  const facultyFeatures = [
    {
      id: 1,
      title: 'Generate Assignments',
      description: 'Create AI-powered assignments from your course materials',
      icon: FileText,
      color: '#a78bfa',
      route: '/dashboard/assignments',
      action: 'Generate Now',
    },
    {
      id: 2,
      title: 'Generate Exam Papers',
      description: 'Create semester exam papers with CO/BT mapping and instant PDF download',
      icon: ScrollText,
      color: '#22d3ee',
      route: '/dashboard/faculty/exam-paper',
      action: 'Open Generator',
    },
    {
      id: 3,
      title: 'Browse Documents',
      description: 'View and manage course materials and learning resources',
      icon: FileText,
      color: '#fb923c',
      route: '/dashboard/documents',
      action: 'View Documents',
    },
    {
      id: 4,
      title: 'Upload Documents',
      description: 'Upload new PDFs, DOCX, TXT, or CSV files for your courses',
      icon: UploadCloud,
      color: '#60a5fa',
      route: '/dashboard/documents/upload',
      action: 'Upload Now',
    },
    {
      id: 5,
      title: 'Answer Questions',
      description: 'Access the AI chat to answer student questions',
      icon: MessageSquare,
      color: '#34d399',
      route: '/dashboard/chat',
      action: 'Go to Chat',
    },
    {
      id: 6,
      title: 'Chat History',
      description: 'View all conversations and analytics',
      icon: History,
      color: '#60a5fa',
      route: '/dashboard/chats',
      action: 'View History',
    },
    {
      id: 7,
      title: 'Settings',
      description: 'Manage your profile and preferences',
      icon: Settings,
      color: '#f472b6',
      route: '/dashboard/settings',
      action: 'Go to Settings',
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div>
      <Header
        title="Faculty Dashboard"
        subtitle="Access all your teaching tools and resources"
      />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={32} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f0f4ff', marginBottom: '4px' }}>
              Welcome Back!
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              Manage assignments, grading, and student performance from one place
            </div>
            {stats && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#cbd5e1', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <span>Assignments: {totalAssignments}</span>
                <span>Pending: {pendingSubmissions}</span>
                <span>Evaluations: {totalEvaluations}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Features Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {facultyFeatures.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                e.currentTarget.style.borderColor = `${feature.color}40`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => router.push(feature.route)}
            >
              {/* Icon */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: `${feature.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  flexShrink: 0,
                }}
              >
                <feature.icon size={24} color={feature.color} />
              </div>

              {/* Content */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#f0f4ff', marginBottom: '6px' }}>
                  {feature.title}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                  {feature.description}
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ gap: '8px' }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: feature.color,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
                onClick={() => router.push(feature.route)}
              >
                {feature.action}
                <ArrowRight size={14} />
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Quick Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(52, 211, 153, 0.05)',
            border: '1px solid rgba(52, 211, 153, 0.1)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            <strong style={{ color: '#34d399' }}>💡 Tip:</strong> Upload your course materials to make them available for student Q&A. Use the chat feature to interact with students in real-time.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
