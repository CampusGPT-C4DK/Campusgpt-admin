'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ClipboardList, Plus, Search, Filter, MoreVertical, Trash2, Edit2,
  Eye, Clock, Users, AlertCircle, CheckCircle2, Calendar
} from 'lucide-react';
import Header from '@/components/Header';
import { taeAPI, TaeAssignment } from '@/lib/taeApi';
import { toast } from 'react-toastify';

export default function FacultyAssignmentsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [assignments, setAssignments] = useState<TaeAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<TaeAssignment | null>(null);
  const [assignmentStats, setAssignmentStats] = useState<any>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        setLoading(true);
        const response = await taeAPI.getMyAssignments();
        setAssignments(response.data || []);
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.assignment_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.branch.toLowerCase().includes(searchTerm.toLowerCase());
    const normalizedStatus = assignment.status === 'archived' ? 'closed' : assignment.status;
    const matchesFilter = filterStatus === 'all' || normalizedStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', label: 'Active' };
      case 'closed':
        return { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', label: 'Closed' };
      case 'archived':
        return { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', label: 'Closed' };
      case 'draft':
        return { bg: 'rgba(168, 162, 162, 0.15)', text: '#a8a2a2', label: 'Draft' };
      default:
        return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', label: status };
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'coding':
        return '#60a5fa';
      case 'practical':
        return '#34d399';
      case 'project':
        return '#fb923c';
      default:
        return '#a78bfa';
    }
  };

  const handleOpenAssignmentDetails = async (assignment: TaeAssignment) => {
    setSelectedAssignment(assignment);
    setDetailsLoading(true);
    try {
      const [statsResponse, submissionsResponse] = await Promise.all([
        taeAPI.getAssignmentStats(assignment.id),
        taeAPI.trackSubmissions(assignment.id),
      ]);
      setAssignmentStats(statsResponse || null);
      setAssignmentSubmissions(submissionsResponse?.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to load assignment details');
      setAssignmentStats(null);
      setAssignmentSubmissions([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignment: TaeAssignment) => {
    const ok = window.confirm(`Delete ${assignment.assignment_no}? This will remove it from Supabase.`);
    if (!ok) return;

    try {
      setDeletingId(assignment.id);
      await taeAPI.deleteAssignment(assignment.id);
      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
      toast.success('Assignment deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete assignment');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div>
      <Header
        title="Assignment Management"
        subtitle="Create, manage, and grade student assignments"
      />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
            }} />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '36px',
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '10px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                background: 'rgba(139, 92, 246, 0.05)',
                color: '#f0f4ff',
                fontSize: '13px',
              }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
              toast.info('Filters reset');
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(96, 165, 250, 0.15)',
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Filter size={14} />
            Filter
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard/assignments')}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} />
            Create Assignment
          </motion.button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'active', 'closed', 'draft'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: filterStatus === tab ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: filterStatus === tab ? '#a78bfa' : '#64748b',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Assignments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading && (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="glass-card shimmer-card"
                  style={{
                    padding: '16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '16px',
                    alignItems: 'center',
                    border: `1px solid rgba(139, 92, 246, 0.2)`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ width: '160px', height: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)' }} />
                      <div style={{ width: '280px', height: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ width: '64px', height: '18px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
                        <div style={{ width: '140px', height: '18px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
                        <div style={{ width: '120px', height: '18px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: '70px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ width: '92px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ width: '82px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && filteredAssignments.map((assignment, idx) => {
            const statusInfo = getStatusColor(assignment.status);
            const daysLeft = getDaysUntilDue(assignment.submission_date);
            const progressPercent = 0;

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card"
                style={{
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '16px',
                  alignItems: 'center',
                  border: `1px solid rgba(139, 92, 246, 0.2)`,
                }}
              >
                {/* Main Content */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `${getTypeColor(assignment.difficulty)}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ClipboardList size={24} color={getTypeColor(assignment.difficulty)} />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#f0f4ff', marginBottom: '2px' }}>
                        {assignment.assignment_no}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {assignment.subject} ({assignment.branch} - Sem {assignment.semester})
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Status */}
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '600',
                        background: statusInfo.bg,
                        color: statusInfo.text,
                        textTransform: 'uppercase',
                      }}>
                        {statusInfo.label}
                      </div>

                      {/* Due Date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                        <Calendar size={12} />
                        {formatDate(assignment.submission_date)}
                        {assignment.status === 'active' && (
                          <span style={{
                            marginLeft: '4px',
                            color: daysLeft <= 3 ? '#f87171' : '#34d399',
                            fontWeight: '600',
                          }}>
                            {daysLeft} days left
                          </span>
                        )}
                      </div>

                      {/* Submissions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                        <Users size={12} />
                        Created by {assignment.created_by || 'faculty'}
                      </div>

                      {/* Live indicator (hide when closed) */}
                      {assignment.status === 'active' && (
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#a78bfa' }}>
                          Live
                        </div>
                      )}
                    </div>

                    {/* Grading Progress */}
                    {false && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '3px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Grading Progress</span>
                          <span>0/0 graded</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '4px',
                          borderRadius: '2px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${progressPercent}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, #34d399, #10b981)`,
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      if (!assignment.pdf_url) {
                        toast.error('PDF URL not available for this assignment');
                        return;
                      }
                      window.open(assignment.pdf_url, '_blank', 'noopener,noreferrer');
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(96, 165, 250, 0.15)',
                      color: '#60a5fa',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Eye size={12} />
                    View
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleOpenAssignmentDetails(assignment)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(52, 211, 153, 0.15)',
                      color: '#34d399',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={12} />
                    Check status
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      const query = new URLSearchParams({
                        assignmentId: assignment.id,
                      });
                      router.push(`/dashboard/assignments?${query.toString()}`);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#a855f7',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit2 size={12} />
                    Edit
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    disabled={deletingId === assignment.id}
                    onClick={() => handleDeleteAssignment(assignment)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      cursor: deletingId === assignment.id ? 'not-allowed' : 'pointer',
                      opacity: deletingId === assignment.id ? 0.6 : 1,
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Trash2 size={12} />
                    {deletingId === assignment.id ? 'Deleting...' : 'Delete'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setActiveMenuId(activeMenuId === assignment.id ? null : assignment.id)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#a78bfa',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MoreVertical size={14} />
                  </motion.button>
                  {activeMenuId === assignment.id && (
                    <div
                      style={{
                        position: 'absolute',
                        marginTop: '44px',
                        right: '18px',
                        minWidth: '160px',
                        borderRadius: '10px',
                        background: '#0b1222',
                        border: '1px solid rgba(139, 92, 246, 0.25)',
                        zIndex: 20,
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        onClick={() => {
                          handleOpenAssignmentDetails(assignment);
                          setActiveMenuId(null);
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          color: '#cbd5e1',
                          textAlign: 'left',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        View Stats
                      </button>
                      <button
                        onClick={() => {
                          if (assignment.pdf_url) {
                            window.open(assignment.pdf_url, '_blank');
                          } else {
                            toast.info('No PDF available for this assignment');
                          }
                          setActiveMenuId(null);
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          background: 'transparent',
                          color: '#cbd5e1',
                          textAlign: 'left',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Open PDF
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {(!loading && filteredAssignments.length === 0) && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b',
          }}>
            <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: '600' }}>No assignments found</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#475569' }}>
              Create a new assignment to get started
            </div>
          </div>
        )}
      </div>

      <style>{`
        .shimmer-card::before {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-120%);
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(186,158,255,0.10) 35%,
            rgba(83,221,252,0.10) 50%,
            rgba(255,255,255,0) 70%
          );
          animation: shimmer 1.35s infinite;
          pointer-events: none;
        }
        @keyframes shimmer {
          100% { transform: translateX(120%); }
        }
      `}</style>

      {selectedAssignment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedAssignment(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '760px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '14px',
              border: '1px solid rgba(139, 92, 246, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f0f4ff' }}>{selectedAssignment.assignment_no}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {selectedAssignment.subject} • {selectedAssignment.branch} • Sem {selectedAssignment.semester}
                </div>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>Loading details...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(59,130,246,0.08)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Submissions</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#60a5fa' }}>{assignmentStats?.total_submissions ?? 0}</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(16,185,129,0.08)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Graded</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>{assignmentStats?.graded_submissions ?? 0}</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(251,146,60,0.08)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Pending</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fb923c' }}>{assignmentStats?.pending_submissions ?? 0}</div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px', fontWeight: 600 }}>
                  Submission Tracking ({assignmentSubmissions.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {assignmentSubmissions.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#64748b' }}>No tracked submissions yet.</div>
                  ) : (
                    assignmentSubmissions.map((sub, i) => (
                      <div key={i} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: '12px', color: '#f0f4ff' }}>{sub.student_name || 'Student'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Grade: {sub.grade ?? 'N/A'} • Status: {sub.status ?? 'pending'} • Marks: {sub.marks ?? 'N/A'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
