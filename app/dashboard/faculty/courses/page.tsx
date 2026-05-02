'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, Plus, Search, Filter, MoreVertical, Edit2,
  Trash2, Eye, Settings, Share2, Archive
} from 'lucide-react';
import Header from '@/components/Header';

export default function FacultyCourseManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const courses = [
    {
      id: 1,
      name: 'Advanced Web Development',
      code: 'CS-301',
      semester: 'Spring 2024',
      students: 42,
      assignments: 3,
      pending: 8,
      status: 'active',
      credits: 4,
      description: 'Learn modern web development with React, Node.js, and databases',
      schedule: 'MW 10:00-11:30 AM',
      room: 'CSE-101',
      maxCapacity: 50,
      enrolled: 42,
    },
    {
      id: 2,
      name: 'Data Structures & Algorithms',
      code: 'CS-201',
      semester: 'Spring 2024',
      students: 38,
      assignments: 4,
      pending: 12,
      status: 'active',
      credits: 4,
      description: 'Master essential data structures and algorithm design patterns',
      schedule: 'TTh 2:00-3:30 PM',
      room: 'CSE-202',
      maxCapacity: 45,
      enrolled: 38,
    },
    {
      id: 3,
      name: 'Database Management Systems',
      code: 'CS-251',
      semester: 'Spring 2024',
      students: 35,
      assignments: 2,
      pending: 5,
      status: 'active',
      credits: 3,
      description: 'Design and optimize database systems using SQL and NoSQL',
      schedule: 'MW 1:00-2:30 PM',
      room: 'CSE-103',
      maxCapacity: 40,
      enrolled: 35,
    },
    {
      id: 4,
      name: 'Machine Learning Basics',
      code: 'CS-401',
      semester: 'Spring 2024',
      students: 13,
      assignments: 3,
      pending: 2,
      status: 'active',
      credits: 4,
      description: 'Introduction to machine learning algorithms and applications',
      schedule: 'MWF 11:00-12:00 PM',
      room: 'CSE-301',
      maxCapacity: 30,
      enrolled: 13,
    },
    {
      id: 5,
      name: 'Web Design Principles',
      code: 'CS-150',
      semester: 'Fall 2023',
      students: 28,
      assignments: 5,
      pending: 15,
      status: 'archived',
      credits: 3,
      description: 'UI/UX design principles and web design best practices',
      schedule: 'TTh 10:00-11:30 AM',
      room: 'CSE-104',
      maxCapacity: 35,
      enrolled: 28,
    },
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (!mounted) {
    return null;
  }

  return (
    <div>
      <Header
        title="Course Management"
        subtitle="Manage your courses and student enrollments"
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
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input"
              style={{
                paddingLeft: '36px',
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '10px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                background: 'rgba(139, 92, 246, 0.05)',
                color: '#f0f4ff',
              }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} />
            New Course
          </motion.button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'active', 'archived'].map((tab) => (
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
              {tab === 'all' ? 'All Courses' : tab === 'active' ? 'Active' : 'Archived'}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredCourses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: `1px solid rgba(${course.status === 'active' ? '96, 165, 250' : '168, 162, 162'}, 0.2)`,
                background: `linear-gradient(145deg, ${course.status === 'active' ? 'rgba(96, 165, 250, 0.02)' : 'rgba(255, 255, 255, 0.02)'}, rgba(139, 92, 246, 0.02))`,
                position: 'relative',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#f0f4ff', marginBottom: '4px' }}>
                    {course.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '600' }}>
                    {course.code}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
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
                    onClick={() => setActiveMenu(activeMenu === course.id ? null : course.id)}
                  >
                    <MoreVertical size={14} />
                  </motion.button>

                  {activeMenu === course.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        borderRadius: '10px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(20px)',
                        zIndex: 10,
                        minWidth: '160px',
                      }}
                    >
                      {[
                        { icon: Eye, label: 'View Details' },
                        { icon: Edit2, label: 'Edit Course' },
                        { icon: Users, label: 'Manage Students' },
                        { icon: Settings, label: 'Settings' },
                        { icon: Archive, label: 'Archive' },
                      ].map((item, i) => (
                        <button
                          key={i}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: 'none',
                            background: 'transparent',
                            color: '#cbd5e1',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderTop: i > 0 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                            e.currentTarget.style.color = '#a78bfa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#cbd5e1';
                          }}
                        >
                          <item.icon size={14} />
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                background: course.status === 'active' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(168, 162, 162, 0.15)',
                color: course.status === 'active' ? '#34d399' : '#a8a2a2',
                textTransform: 'uppercase',
                width: 'fit-content',
              }}>
                {course.status}
              </div>

              {/* Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(96, 165, 250, 0.08)' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>STUDENTS</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#60a5fa' }}>
                    {course.enrolled}/{course.maxCapacity}
                  </div>
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.08)' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>PENDING GRADE</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#a855f7' }}>
                    {course.pending}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                {course.description}
              </div>

              {/* Footer */}
              <div style={{ fontSize: '11px', color: '#64748b', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ marginBottom: '4px' }}>📍 {course.room} • {course.credits} Credits</div>
                <div>🕒 {course.schedule}</div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(96, 165, 250, 0.15)',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  View Details
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#a78bfa',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  Manage
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b',
          }}>
            <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: '600' }}>No courses found</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#475569' }}>
              Try adjusting your search or filters
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
