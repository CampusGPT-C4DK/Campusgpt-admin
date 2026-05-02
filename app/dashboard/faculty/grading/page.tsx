'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileCheck, Search, Filter, MoreVertical, Download, Eye,
  MessageSquare, CheckCircle2, Clock,
} from 'lucide-react';
import Header from '@/components/Header';
import { taeAPI, TaePendingSubmission } from '@/lib/taeApi';
import { toast } from 'react-toastify';

export default function FacultyGradingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFromUrl = searchParams.get('assignmentId');

  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<TaePendingSubmission[]>([]);
  const [marksBySubmission, setMarksBySubmission] = useState<Record<string, number>>({});
  const [feedbackBySubmission, setFeedbackBySubmission] = useState<Record<string, string>>({});
  const [resultBySubmission, setResultBySubmission] = useState<Record<string, 'passed' | 'failed'>>({});
  const [allowResubmitBySubmission, setAllowResubmitBySubmission] = useState<Record<string, boolean>>({});
  const [viewLoadingBySubmission, setViewLoadingBySubmission] = useState<Record<string, boolean>>({});
  const [editingBySubmission, setEditingBySubmission] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (typeof err === 'object' && err !== null) {
      const response = (err as { response?: { data?: { detail?: string } } }).response;
      const detail = response?.data?.detail;
      if (typeof detail === 'string' && detail.trim()) return detail;
    }
    return fallback;
  };

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        setLoading(true);
        const response = await taeAPI.getPendingSubmissions();
        setPendingSubmissions(response.data || []);

        // Prefill local UI state from server evaluations (so edit works immediately)
        const seedMarks: Record<string, number> = {};
        const seedFeedback: Record<string, string> = {};
        const seedResult: Record<string, 'passed' | 'failed'> = {};
        const seedResubmit: Record<string, boolean> = {};
        (response.data || []).forEach((s: TaePendingSubmission) => {
          if (typeof s.evaluation?.marks_obtained === 'number') seedMarks[s.id] = s.evaluation.marks_obtained;
          if (typeof s.evaluation?.feedback === 'string') seedFeedback[s.id] = s.evaluation.feedback;
          if (s.status === 'passed' || s.status === 'failed') seedResult[s.id] = s.status;
          if (typeof s.allow_resubmission === 'boolean') seedResubmit[s.id] = s.allow_resubmission;
        });
        setMarksBySubmission((prev) => ({ ...seedMarks, ...prev }));
        setFeedbackBySubmission((prev) => ({ ...seedFeedback, ...prev }));
        setResultBySubmission((prev) => ({ ...seedResult, ...prev }));
        setAllowResubmitBySubmission((prev) => ({ ...seedResubmit, ...prev }));
      } catch (err: unknown) {
        toast.error(extractErrorMessage(err, 'Failed to load submissions'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Keep selected assignment in URL so browser back goes to assignment list
  useEffect(() => {
    if (!mounted) return;
    setSelectedAssignmentId(selectedFromUrl);
    if (!selectedFromUrl) setSelectedSubmission(null);
  }, [mounted, selectedFromUrl]);

  const openAssignment = (assignmentId: string) => {
    const qp = new URLSearchParams(searchParams.toString());
    qp.set('assignmentId', assignmentId);
    router.push(`/dashboard/faculty/grading?${qp.toString()}`);
  };

  const closeAssignment = () => {
    const qp = new URLSearchParams(searchParams.toString());
    qp.delete('assignmentId');
    router.push(`/dashboard/faculty/grading${qp.toString() ? `?${qp.toString()}` : ''}`);
  };
  const submissions = pendingSubmissions.map((sub: TaePendingSubmission) => ({
    id: sub.id,
    studentName: sub.student_name || 'Student',
    studentEmail: sub.student_email || 'N/A',
    rollNumber: sub.student_id?.slice(0, 8) || 'N/A',
    assignment: sub.assignments?.assignment_no || sub.assignment_id,
    assignmentId: sub.assignment_id,
    course: sub.assignments?.subject || 'Subject',
    submissionDate: sub.submitted_at || new Date().toISOString(),
    dueDate: sub.assignments?.submission_date || new Date().toISOString(),
    status: sub.status,
    isEvaluated: Boolean((sub as any).is_evaluated || sub.evaluation?.evaluated_at || typeof sub.evaluation?.marks_obtained === 'number'),
    score: typeof sub.evaluation?.marks_obtained === 'number' ? sub.evaluation.marks_obtained : (marksBySubmission[sub.id] ?? null),
    maxScore: 100,
    feedback: sub.evaluation?.feedback || feedbackBySubmission[sub.id] || '',
    lateSubmission: !!sub.is_late,
    daysLate: sub.days_late || 0,
    fileSize: '--',
    fileName: sub.submitted_file_url ? 'submission.pdf' : 'file',
    grade: sub.evaluation?.grade || null,
  }));

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.assignment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'submitted' && !sub.isEvaluated) ||
      (filterStatus === 'graded' && sub.isEvaluated);
    const matchesAssignment = !selectedAssignmentId || sub.assignmentId === selectedAssignmentId;
    return matchesSearch && matchesFilter && matchesAssignment;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    switch (sortBy) {
      case 'student':
        return a.studentName.localeCompare(b.studentName);
      case 'score':
        return (b.score || 0) - (a.score || 0);
      default:
        return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'Submitted' };
      case 'graded':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', label: 'Graded' };
      case 'passed':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', label: 'Passed' };
      case 'failed':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Failed' };
      case 'late':
        return { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', label: 'Late' };
      default:
        return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', label: status };
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return '#22c55e';
    if (percentage >= 80) return '#3b82f6';
    if (percentage >= 70) return '#fb923c';
    return '#ef4444';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  // Group submissions into assignment cards for step-1 UI
  const assignmentGroups = submissions.reduce((acc, sub) => {
    const id = sub.assignmentId;
    if (!acc[id]) {
      acc[id] = {
        assignmentId: id,
        assignmentNo: sub.assignment,
        course: sub.course,
        dueDate: sub.dueDate,
        total: 0,
        graded: 0,
        pending: 0,
        late: 0,
      };
    }
    acc[id].total += 1;
    if (sub.isEvaluated) acc[id].graded += 1;
    else acc[id].pending += 1;
    if (sub.lateSubmission) acc[id].late += 1;
    return acc;
  }, {} as Record<string, { assignmentId: string; assignmentNo: string; course: string; dueDate: string; total: number; graded: number; pending: number; late: number }>);

  const assignmentCards = Object.values(assignmentGroups).sort(
    (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  );

  const selectedAssignment = selectedAssignmentId ? assignmentGroups[selectedAssignmentId] : null;

  if (!mounted) {
    return null;
  }

  const submitGrade = async (submissionId: string) => {
    const marks = marksBySubmission[submissionId];
    if (marks === undefined || Number.isNaN(marks)) {
      toast.error('Enter marks before submitting');
      return;
    }
    const grade = marks >= 90 ? 'A' : marks >= 80 ? 'B' : marks >= 70 ? 'C' : marks >= 60 ? 'D' : 'F';
    const resultStatus = resultBySubmission[submissionId] || 'passed';
    try {
      const res = await taeAPI.gradeSubmission({
        submission_id: submissionId,
        total_marks: 100,
        marks_obtained: marks,
        grade,
        result_status: resultStatus,
        allow_resubmission: resultStatus === 'failed' && Boolean(allowResubmitBySubmission[submissionId]),
        feedback: feedbackBySubmission[submissionId] || '',
      });
      toast.success('Submission graded successfully');
      // Mark as evaluated in UI so it moves from Pending -> Graded immediately
      const updatedStatus = (res?.result_status || resultStatus) as 'passed' | 'failed';
      setPendingSubmissions((prev) =>
        prev.map((s: TaePendingSubmission) =>
          s.id !== submissionId
            ? s
            : {
                ...s,
                status: updatedStatus,
                is_evaluated: true,
                evaluation: {
                  ...(s.evaluation || {}),
                  total_marks: 100,
                  marks_obtained: marks,
                  grade,
                  feedback: feedbackBySubmission[submissionId] || '',
                  evaluated_at: new Date().toISOString(),
                },
                allow_resubmission: resultStatus === 'failed' && Boolean(allowResubmitBySubmission[submissionId]),
              }
        )
      );
      setEditingBySubmission((prev) => ({ ...prev, [submissionId]: false }));
      setSelectedSubmission(null);
      // Refresh from server (non-blocking for UX correctness)
      try {
        const refreshed = await taeAPI.getPendingSubmissions();
        setPendingSubmissions(refreshed.data || []);
      } catch {
        // ignore refresh errors
      }
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to grade submission'));
    }
  };

  const handleViewSubmission = async (submissionId: string) => {
    setViewLoadingBySubmission((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const response = await taeAPI.getSubmissionForGrading(submissionId);
      const submission = response?.submission;
      const fileUrl = submission?.submitted_file_url;

      if (!fileUrl) {
        toast.info('No submitted file URL found for this submission');
        return;
      }

      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to open submission file'));
    } finally {
      setViewLoadingBySubmission((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  return (
    <div>
      <Header
        title="Student Submissions & Grading"
        subtitle="Review, grade, and provide feedback on student assignments"
      />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Step header (Assignment -> Submissions) */}
        {selectedAssignmentId && selectedAssignment && (
          <div className="glass-card" style={{ padding: '14px 16px', border: '1px solid rgba(139, 92, 246, 0.18)', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff' }}>
                {selectedAssignment.assignmentNo} • {selectedAssignment.course}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span><strong style={{ color: '#94a3b8' }}>Due:</strong> {formatDate(selectedAssignment.dueDate)}</span>
                <span><strong style={{ color: '#94a3b8' }}>Total:</strong> {selectedAssignment.total}</span>
                <span><strong style={{ color: '#94a3b8' }}>Graded:</strong> {selectedAssignment.graded}</span>
                <span><strong style={{ color: '#94a3b8' }}>Pending:</strong> {selectedAssignment.pending}</span>
                <span><strong style={{ color: '#94a3b8' }}>Late:</strong> {selectedAssignment.late}</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => closeAssignment()}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                background: 'rgba(148, 163, 184, 0.06)',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              Back to assignments
            </motion.button>
          </div>
        )}

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
              placeholder="Search submissions..."
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
            <Download size={14} />
            Export
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#a78bfa',
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
        </div>

        {/* Filter & Sort Row */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'submitted', 'graded'].map((tab) => (
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                background: 'rgba(139, 92, 246, 0.05)',
                color: '#f0f4ff',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <option value="date">Submission Date</option>
              <option value="student">Student Name</option>
              <option value="score">Score</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            {selectedAssignmentId ? `${sortedSubmissions.length} submissions` : `${assignmentCards.length} assignments`}
          </div>
        </div>

        {/* Step 1: Assignments List */}
        {!selectedAssignmentId && (
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
                        <div style={{ width: '220px', height: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)' }} />
                        <div style={{ width: '320px', height: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ width: '70px', height: '18px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
                          <div style={{ width: '70px', height: '18px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
                          <div style={{ width: '70px', height: '18px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ width: '120px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                ))}
              </>
            )}

            {!loading && assignmentCards.map((a, idx) => (
              <motion.div
                key={a.assignmentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="glass-card"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: '1px solid rgba(139, 92, 246, 0.18)',
                }}
                onClick={() => openAssignment(a.assignmentId)}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileCheck size={24} color="#a78bfa" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#f0f4ff', marginBottom: '2px' }}>
                          {a.assignmentNo}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {a.course} • Due: {formatDate(a.dueDate)}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                        {a.graded}/{a.total} graded
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'rgba(52,211,153,0.10)', color: '#34d399', fontWeight: 800 }}>Graded: {a.graded}</span>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'rgba(251,146,60,0.10)', color: '#fb923c', fontWeight: 800 }}>Pending: {a.pending}</span>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'rgba(239,68,68,0.10)', color: '#ef4444', fontWeight: 800 }}>Late: {a.late}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Step 2: Submissions List (for selected assignment) */}
        {selectedAssignmentId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedSubmissions.map((sub, idx) => {
            const statusInfo = getStatusColor(sub.status);
            const scoreColor = getScoreColor(sub.score ?? 0, sub.maxScore);
            const isLocked = (sub.status === 'passed' || sub.status === 'failed') && !editingBySubmission[sub.id];

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedSubmission(selectedSubmission === sub.id ? null : sub.id)}
                className="glass-card"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: `2px solid ${selectedSubmission === sub.id ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.1)'}`,
                  transition: 'all 0.2s',
                }}
              >
                {/* Main Row */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(96, 165, 250, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileCheck size={24} color="#60a5fa" />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#f0f4ff', marginBottom: '2px' }}>
                          {sub.studentName} <span style={{ fontSize: '12px', color: '#64748b' }}>{sub.rollNumber}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {sub.assignment} • {sub.course}
                        </div>
                      </div>

                      {/* Score Badge */}
                      {sub.score !== null && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: `${scoreColor}20`,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: scoreColor }}>
                            {sub.score}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>/{sub.maxScore}</div>
                        </div>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px' }}>
                      {/* Status */}
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: statusInfo.bg,
                        color: statusInfo.text,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: '10px',
                      }}>
                        {statusInfo.label}
                      </div>

                      {/* Submission Date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                        <Clock size={12} />
                        {formatDate(sub.submissionDate)}
                      {(sub.status === 'passed' || sub.status === 'failed') && (
                        <span style={{
                          marginLeft: '6px',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: statusInfo.bg,
                          color: statusInfo.text,
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}>
                          {statusInfo.label}
                        </span>
                      )}
                        {sub.lateSubmission && (
                          <span style={{ marginLeft: '4px', color: '#ef4444', fontWeight: '600' }}>
                            ({sub.daysLate ? `${sub.daysLate} day(s) late` : 'Late'})
                          </span>
                        )}
                        {!sub.lateSubmission && (
                          <span style={{ marginLeft: '4px', color: '#22c55e', fontWeight: '600' }}>
                            (Within deadline)
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#64748b' }}>
                        Due: {formatDate(sub.dueDate)}
                      </div>

                      {/* File Info */}
                      <div style={{ color: '#64748b' }}>
                        📎 {sub.fileName} ({sub.fileSize})
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSubmission(sub.id);
                      }}
                      disabled={!!viewLoadingBySubmission[sub.id]}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(96, 165, 250, 0.15)',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="View Submission"
                    >
                      <Eye size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(168, 85, 247, 0.15)',
                        color: '#a855f7',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Give Feedback"
                    >
                      <MessageSquare size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
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
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedSubmission === sub.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                    style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(139, 92, 246, 0.2)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Student / submission details */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: statusInfo.bg,
                          color: statusInfo.text,
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}>
                          {statusInfo.label}
                        </div>
                        {(sub.status === 'passed' || sub.status === 'failed') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBySubmission((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }));
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              border: '1px solid rgba(139, 92, 246, 0.25)',
                              background: 'rgba(139, 92, 246, 0.08)',
                              color: '#a78bfa',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {editingBySubmission[sub.id] ? 'Lock' : 'Edit'}
                          </button>
                        )}
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          <strong style={{ color: '#cbd5e1' }}>Email:</strong> {sub.studentEmail}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          <strong style={{ color: '#cbd5e1' }}>Submission ID:</strong> {sub.id}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          <strong style={{ color: '#cbd5e1' }}>Assignment ID:</strong> {sub.assignmentId}
                        </div>
                      </div>
                    </div>
                    {/* Score Input */}
                    {true && (
                      <div>
                        <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                          Give Score
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="number"
                            placeholder="0"
                            max={sub.maxScore}
                            value={marksBySubmission[sub.id] ?? sub.score ?? ''}
                            onChange={(e) =>
                              setMarksBySubmission((prev) => ({
                                ...prev,
                                [sub.id]: Number(e.target.value),
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            disabled={isLocked}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              background: 'rgba(139, 92, 246, 0.05)',
                              color: '#f0f4ff',
                              fontSize: '12px',
                              opacity: isLocked ? 0.6 : 1,
                            }}
                          />
                          <span style={{ padding: '8px 12px', color: '#64748b', fontSize: '12px' }}>
                            /{sub.maxScore}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    <div>
                      <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Feedback
                      </label>
                      <textarea
                        placeholder="Add feedback for the student..."
                        value={feedbackBySubmission[sub.id] ?? sub.feedback ?? ''}
                        onChange={(e) =>
                          setFeedbackBySubmission((prev) => ({
                            ...prev,
                            [sub.id]: e.target.value,
                          }))
                        }
                        onClick={(e) => e.stopPropagation()}
                        disabled={isLocked}
                        style={{
                          width: '100%',
                          height: '60px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          background: 'rgba(139, 92, 246, 0.05)',
                          color: '#f0f4ff',
                          fontSize: '12px',
                          resize: 'none',
                          fontFamily: 'inherit',
                          opacity: isLocked ? 0.6 : 1,
                        }}
                      />
                    </div>

                    {/* Pass/Fail selector */}
                    <div>
                      <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Result Status
                      </label>
                      <select
                        value={resultBySubmission[sub.id] || (sub.status === 'failed' ? 'failed' : 'passed')}
                        onChange={(e) =>
                          setResultBySubmission((prev) => ({
                            ...prev,
                            [sub.id]: e.target.value as 'passed' | 'failed',
                          }))
                        }
                        onClick={(e) => e.stopPropagation()}
                        disabled={isLocked}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          background: 'rgba(139, 92, 246, 0.05)',
                          color: '#f0f4ff',
                          fontSize: '12px',
                          opacity: isLocked ? 0.6 : 1,
                        }}
                      >
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>

                    {/* Resubmission toggle (only meaningful for failed result) */}
                    <div>
                      <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Allow Resubmission
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(allowResubmitBySubmission[sub.id])}
                          onChange={(e) =>
                            setAllowResubmitBySubmission((prev) => ({
                              ...prev,
                              [sub.id]: e.target.checked,
                            }))
                          }
                          disabled={isLocked || (resultBySubmission[sub.id] || (sub.status === 'failed' ? 'failed' : 'passed')) !== 'failed'}
                        />
                        Enable student resubmission for failed result
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          submitGrade(sub.id);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #34d399, #10b981)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Submit Grade
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubmission(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          background: 'transparent',
                          color: '#a78bfa',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
        )}

        {sortedSubmissions.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b',
          }}>
            <FileCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {selectedAssignmentId ? 'No submissions found for this assignment' : 'No assignments found'}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#475569' }}>
              Try adjusting your search or filters
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
    </div>
  );
}
