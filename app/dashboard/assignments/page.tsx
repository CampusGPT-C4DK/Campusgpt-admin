'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Loader, Plus, Trash2, Eye,
} from 'lucide-react';
import Header from '@/components/Header';
import { toast } from 'react-toastify';
import { taeAPI, TaeAssignment } from '@/lib/taeApi';

interface Assignment {
  id: string;
  subject: string;
  branch: string;
  semester: string;
  assignmentNo: string;
  difficulty: string;
  faculty: string;
  givenDate: string;
  submissionDate: string;
  pdfPath: string;
  questions: any[];
  createdAt: string;
}

const normalizeQuestions = (input: unknown): any[] => {
  if (Array.isArray(input)) return input;
  if (!input) return [];

  // Some rows can store jsonb as object/string depending on serializer path.
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [input];
    }
  }

  if (typeof input === 'object') return [input];
  return [String(input)];
};

export default function AssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentIdFromQuery = searchParams.get('assignmentId');

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<'active' | 'archived' | 'draft'>('active');

  // Form state
  const [formData, setFormData] = useState({
    difficulty: 'medium',
    assignmentNo: '',
    subject: '',
    branch: '',
    semester: '',
    faculty: '',
    givenDate: new Date().toISOString().split('T')[0],
    submissionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const response = await taeAPI.getMyAssignments();
        const mapped: Assignment[] = (response.data || []).map((a: TaeAssignment) => ({
          id: a.id,
          subject: a.subject,
          branch: a.branch,
          semester: a.semester,
          assignmentNo: a.assignment_no,
          difficulty: a.difficulty,
          faculty: a.created_by || 'Faculty',
          givenDate: a.given_date,
          submissionDate: a.submission_date,
          pdfPath: a.pdf_url || '',
          questions: normalizeQuestions(a.questions),
          createdAt: a.created_at || new Date().toISOString(),
        }));
        setAssignments(mapped);
      } catch (err: any) {
        console.error('Failed to load existing assignments:', err);
      }
    };

    // Pre-fill faculty name from logged-in user profile if available.
    try {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user?.full_name) {
          setFormData((prev) => ({ ...prev, faculty: user.full_name }));
        }
      }
    } catch {
      // Ignore parsing issues silently.
    }

    loadAssignments();
  }, []);

  // Edit mode: open only the single clicked assignment (from faculty list)
  useEffect(() => {
    const loadEditingAssignment = async () => {
      if (!assignmentIdFromQuery) {
        setEditingId(null);
        return;
      }
      try {
        setLoading(true);
        const res = await taeAPI.getAssignment(assignmentIdFromQuery);
        const a = res.data;
        setEditingId(a.id);
        setEditingStatus((a.status as any) || 'active');
        setUploadedFiles([]);
        setFormData((prev) => ({
          ...prev,
          difficulty: a.difficulty || 'medium',
          assignmentNo: a.assignment_no || '',
          subject: a.subject || '',
          branch: a.branch || '',
          semester: a.semester || '',
          faculty: a.created_by || prev.faculty || '',
          givenDate: a.given_date || prev.givenDate,
          submissionDate: a.submission_date || prev.submissionDate,
        }));
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || 'Failed to load assignment for editing');
      } finally {
        setLoading(false);
      }
    };
    loadEditingAssignment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentIdFromQuery]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setUploadedFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
    }
    // Allow selecting the same file again (input change event won't fire otherwise).
    e.target.value = '';
  };

  // Remove file
  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate / Update assignment
  const handleGenerateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEditing = Boolean(editingId);

    // Validation (only for create)
    if (!isEditing && !uploadedFiles.length) {
      toast.error('Please upload at least one file');
      return;
    }
    if (!formData.subject || !formData.branch || !formData.semester || !formData.faculty || !formData.assignmentNo) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      if (isEditing && editingId) {
        await taeAPI.updateAssignment(editingId, {
          assignment_no: formData.assignmentNo,
          subject: formData.subject,
          branch: formData.branch,
          semester: formData.semester,
          difficulty: formData.difficulty,
          given_date: formData.givenDate,
          submission_date: formData.submissionDate,
          created_by: formData.faculty,
          status: editingStatus,
        });

        setAssignments((prev) =>
          prev.map((x) =>
            x.id !== editingId
              ? x
              : {
                  ...x,
                  subject: formData.subject,
                  branch: formData.branch,
                  semester: formData.semester,
                  assignmentNo: formData.assignmentNo,
                  difficulty: formData.difficulty,
                  faculty: formData.faculty,
                  givenDate: formData.givenDate,
                  submissionDate: formData.submissionDate,
                }
          )
        );

        toast.success('✅ Assignment updated!');
      } else {
        const data = await taeAPI.uploadTeacherNotes({
          files: uploadedFiles,
          difficulty: formData.difficulty,
          assignment_no: formData.assignmentNo,
          subject: formData.subject,
          branch: formData.branch,
          semester: formData.semester,
          faculty: formData.faculty,
          given_date: formData.givenDate,
          submission_date: formData.submissionDate,
        });

        const newAssignment: Assignment = {
          id: data.assignment_id || Date.now().toString(),
          subject: formData.subject,
          branch: formData.branch,
          semester: formData.semester,
          assignmentNo: formData.assignmentNo,
          difficulty: formData.difficulty,
          faculty: formData.faculty,
          givenDate: formData.givenDate,
          submissionDate: formData.submissionDate,
          pdfPath: data.pdf_url || '',
          questions: normalizeQuestions(data.questions),
          createdAt: new Date().toISOString(),
        };

        setAssignments([newAssignment, ...assignments]);

        setUploadedFiles([]);
        setFormData({
          difficulty: 'medium',
          assignmentNo: '',
          subject: '',
          branch: '',
          semester: '',
          faculty: formData.faculty,
          givenDate: new Date().toISOString().split('T')[0],
          submissionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });

        toast.success('✅ Assignment generated successfully!');
      }
    } catch (error: any) {
      console.error('Error generating assignment:', error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        (editingId ? 'Failed to update assignment' : 'Failed to generate assignment');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async (id: string) => {
    const ok = window.confirm('Delete this assignment? This will also remove its submissions data.');
    if (!ok) return;

    try {
      await taeAPI.deleteAssignment(id);
      setAssignments((prev) => prev.filter(a => a.id !== id));
      toast.success('Assignment deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete assignment');
    }
  };

  return (
    <div>
      <Header
        title={editingId ? 'Edit Assignment' : 'Assignment Generator'}
        subtitle={editingId ? 'Update assignment details and status' : 'Create custom assignments from course materials using AI'}
      />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Generation Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#f0f4ff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} color="#8b5cf6" />
            {editingId ? 'Edit Assignment' : 'Generate New Assignment'}
          </div>

          <form onSubmit={handleGenerateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* File Upload Section (create only) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
                📄 Upload Course Notes (PDF)
              </label>
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: '2px dashed rgba(139, 92, 246, 0.3)',
                  background: 'rgba(139, 92, 246, 0.05)',
                  cursor: editingId ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  opacity: editingId ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (editingId) return;
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  if (editingId) return;
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                }}
                onClick={() => !editingId && document.getElementById('fileInput')?.click()}
              >
                <Upload size={24} color="#8b5cf6" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', color: '#f0f4ff', fontWeight: '600' }}>
                  {editingId ? 'Upload disabled while editing' : 'Click to upload or drag and drop'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  PDF files only • Multiple files supported
                </div>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={Boolean(editingId)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(52, 211, 153, 0.1)',
                        border: '1px solid rgba(52, 211, 153, 0.2)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#34d399" />
                        <span style={{ fontSize: '12px', color: '#f0f4ff' }}>{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grid Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Assignment Number */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Assignment No. *
                </label>
                <input
                  type="text"
                  name="assignmentNo"
                  value={formData.assignmentNo}
                  onChange={handleInputChange}
                  placeholder="e.g., Assignment 1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f0f4ff',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="e.g., Data Structures"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f0f4ff',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Branch */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Branch *
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  placeholder="e.g., CSE"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f0f4ff',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Semester */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Semester *
                </label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  placeholder="e.g., 3"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f0f4ff',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Faculty */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Faculty Name *
                </label>
                <input
                  type="text"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleInputChange}
                  placeholder="e.g., Dr. Smith"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f0f4ff',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Difficulty */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Difficulty Level
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f0f4ff',
                    fontSize: '13px',
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Given Date */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Given Date
                </label>
                <input
                  type="date"
                  name="givenDate"
                  value={formData.givenDate}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f0f4ff',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Submission Date */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Submission Date
                </label>
                <input
                  type="date"
                  name="submissionDate"
                  value={formData.submissionDate}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f0f4ff',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* Status controls (edit only) */}
            {editingId && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                  Status: <span style={{ color: editingStatus === 'active' ? '#34d399' : '#60a5fa' }}>{editingStatus === 'active' ? 'Live' : 'Closed'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStatus((prev) => (prev === 'active' ? 'archived' : 'active'))}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(96, 165, 250, 0.25)',
                    background: 'rgba(96, 165, 250, 0.08)',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  {editingStatus === 'active' ? 'Deactivate (Close)' : 'Activate (Live)'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/faculty/assignments')}
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
                  Back
                </button>
              </div>
            )}

            {/* Generate/Save Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                background: loading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  {editingId ? 'Saving...' : 'Generating Assignment...'}
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {editingId ? 'Save Changes' : 'Generate Assignment'}
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Generated Assignments List */}
        {(editingId ? assignments.filter(a => a.id === editingId).length > 0 : assignments.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f0f4ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#34d399" />
              {editingId ? 'Selected Assignment (Edit Mode)' : `Generated Assignments (${assignments.length})`}
            </div>

            {(editingId ? assignments.filter(a => a.id === editingId) : assignments).map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card"
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  background: 'rgba(52, 211, 153, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#f0f4ff' }}>
                        {assignment.subject} - {assignment.assignmentNo}
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        background: assignment.difficulty === 'easy' ? 'rgba(52, 211, 153, 0.2)' :
                                   assignment.difficulty === 'medium' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: assignment.difficulty === 'easy' ? '#34d399' :
                               assignment.difficulty === 'medium' ? '#fb923c' : '#ef4444',
                      }}>
                        {assignment.difficulty}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                      <span>📚 {assignment.branch} - Sem {assignment.semester}</span>
                      <span>👨‍🏫 {assignment.faculty}</span>
                      <span>📅 Due: {new Date(assignment.submissionDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (!assignment.pdfPath) {
                          toast.error('PDF URL not available for this assignment');
                          return;
                        }
                        window.open(assignment.pdfPath, '_blank', 'noopener,noreferrer');
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(96, 165, 250, 0.3)',
                        background: 'rgba(96, 165, 250, 0.1)',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Eye size={14} />
                      View
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {assignments.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              borderRadius: '12px',
              border: '1px dashed rgba(139, 92, 246, 0.2)',
            }}
          >
            <FileText size={48} color="#64748b" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              No assignments generated yet. Upload your course notes above to get started!
            </div>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(96, 165, 250, 0.05)',
            border: '1px solid rgba(96, 165, 250, 0.1)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertCircle size={16} color="#60a5fa" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              <strong style={{ color: '#60a5fa' }}>ℹ️ How it works:</strong> Upload your course notes in PDF format. The AI will analyze the content and generate multiple-choice questions based on the difficulty level you select. Download the generated PDF assignment for distribution to students.
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
