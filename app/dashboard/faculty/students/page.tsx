'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, Filter, Mail, Phone, MoreVertical, MessageSquare,
  TrendingUp, Award, Clock, Download, FileText
} from 'lucide-react';
import Header from '@/components/Header';
import { taeAPI } from '@/lib/taeApi';
import { toast } from 'react-toastify';

export default function FacultyStudentsPage() {
  return <FacultyStudentsContent />;
}

function FacultyStudentsContent() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        const response = await taeAPI.getFacultyStudentsPerformance();
        const mapped = (response.students || []).map((s, idx) => ({
          id: s.student_id || String(idx),
          name: s.full_name || 'Student',
          email: s.email || 'N/A',
          phone: 'N/A',
          rollNumber: (s.student_id || 'N/A').slice(0, 8),
          course: 'all',
          courseName: 'TAE',
          gpa: Number(((s.average_percentage || 0) / 25).toFixed(2)),
          attendance: Math.min(100, (s.submission_count || 0) * 10),
          assignmentsSubmitted: s.submission_count || 0,
          assignmentsTotal: Math.max(s.submission_count || 0, 1),
          performance: (s.average_percentage || 0) >= 80 ? 'excellent' : (s.average_percentage || 0) >= 60 ? 'good' : 'needs_improvement',
          joinDate: new Date().toISOString(),
          avatar: idx % 2 ? '👩‍🎓' : '👨‍🎓',
        }));
        setStudents(mapped);
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || 'Failed to load student performance');
      }
    };
    load();
  }, []);

  const courses = [
    { id: 'all', name: 'All Courses' },
    { id: 'cs301', name: 'Advanced Web Development' },
    { id: 'cs201', name: 'Data Structures & Algorithms' },
    { id: 'cs251', name: 'Database Management Systems' },
    { id: 'cs401', name: 'Machine Learning Basics' },
  ];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === 'all' || student.course === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        const performanceOrder: Record<string, number> = { excellent: 0, good: 1, needs_improvement: 2 };
        return performanceOrder[a.performance] - performanceOrder[b.performance];
      case 'gpa':
        return b.gpa - a.gpa;
      case 'attendance':
        return b.attendance - a.attendance;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', label: 'Excellent' };
      case 'good':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'Good' };
      case 'needs_improvement':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Needs Improvement' };
      default:
        return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', label: performance };
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div>
      <Header
        title="Student Management"
        subtitle="Monitor and manage your enrolled students"
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
              placeholder="Search by name, email, or roll number..."
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

        {/* Filter Row */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Course:</span>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
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
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
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
              <option value="name">Name</option>
              <option value="performance">Performance</option>
              <option value="gpa">GPA</option>
              <option value="attendance">Attendance</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            Showing {sortedStudents.length} students
          </div>
        </div>

        {/* Students Table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <th style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    background: 'rgba(139, 92, 246, 0.05)',
                  }}>Name</th>
                  <th style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    background: 'rgba(139, 92, 246, 0.05)',
                  }}>Roll Number</th>
                  <th style={{
                    padding: '14px 16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    background: 'rgba(139, 92, 246, 0.05)',
                  }}>GPA</th>
                  <th style={{
                    padding: '14px 16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    background: 'rgba(139, 92, 246, 0.05)',
                  }}>Attendance</th>
                  <th style={{
                    padding: '14px 16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    background: 'rgba(139, 92, 246, 0.05)',
                  }}>Assignments</th>
                  <th style={{
                    padding: '14px 16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    background: 'rgba(139, 92, 246, 0.05)',
                  }}>Performance</th>
                  <th style={{
                    padding: '14px 16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    background: 'rgba(139, 92, 246, 0.05)',
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, idx) => {
                  const performanceInfo = getPerformanceColor(student.performance);
                  return (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      style={{
                        borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Student Name */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ fontSize: '24px' }}>{student.avatar}</div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff' }}>
                              {student.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#cbd5e1' }}>
                        {student.rollNumber}
                      </td>

                      {/* GPA */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(96, 165, 250, 0.15)',
                          color: '#60a5fa',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}>
                          {student.gpa.toFixed(2)}
                        </div>
                      </td>

                      {/* Attendance */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: student.attendance >= 90 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 146, 60, 0.15)',
                          color: student.attendance >= 90 ? '#22c55e' : '#fb923c',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}>
                          {student.attendance}%
                        </div>
                      </td>

                      {/* Assignments */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(168, 85, 247, 0.15)',
                          color: '#a855f7',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}>
                          {student.assignmentsSubmitted}/{student.assignmentsTotal}
                        </div>
                      </td>

                      {/* Performance */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: performanceInfo.bg,
                          color: performanceInfo.text,
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        }}>
                          {performanceInfo.label}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'rgba(96, 165, 250, 0.15)',
                              color: '#60a5fa',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Send Message"
                          >
                            <MessageSquare size={12} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'rgba(139, 92, 246, 0.15)',
                              color: '#a78bfa',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="View Profile"
                          >
                            <Users size={12} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MoreVertical size={12} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {sortedStudents.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b',
          }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: '600' }}>No students found</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#475569' }}>
              Try adjusting your search or filters
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
