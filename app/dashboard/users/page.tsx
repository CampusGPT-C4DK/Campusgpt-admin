'use client';

import { useState, useEffect } from 'react';
import { adminAPI, handleApiError } from '@/lib/api';
import { toast } from 'react-toastify';
import Header from '@/components/Header';
import {
  Users, Search, RefreshCw, UserCheck, UserX,
  Shield, GraduationCap, ChevronLeft, ChevronRight,
  MoreVertical, Mail, Calendar, Activity,
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const limit = 15;

  useEffect(() => { fetchUsers(); }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUsers(page * limit, limit);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      // Show empty state if endpoint not available
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: string, currentStatus: boolean, name: string) => {
    setUpdating(userId);
    try {
      await adminAPI.toggleUserStatus(userId, !currentStatus);
      toast.success(`${name} ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / limit);

  const roleIcon = (role: string) => {
    if (role === 'admin' || role === 'super_admin') return <Shield size={12} color="#60a5fa" />;
    return <GraduationCap size={12} color="#34d399" />;
  };

  const roleClass = (role: string) => {
    if (role === 'super_admin') return 'badge-danger';
    if (role === 'admin') return 'badge-info';
    if (role === 'faculty') return 'badge-purple';
    return 'badge-success';
  };

  const stats = [
    { label: 'Total Users', value: total, color: '#60a5fa' },
    { label: 'Admins', value: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length, color: '#a78bfa' },
    { label: 'Students', value: users.filter(u => u.role === 'student').length, color: '#34d399' },
    { label: 'Active', value: users.filter(u => u.is_active !== false).length, color: '#fb923c' },
  ];

  return (
    <div>
      <Header
        title="User Management"
        subtitle={`${total} registered users`}
        actions={
          <button onClick={fetchUsers} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {stats.map((s, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users size={20} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#f0f4ff' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input-field" style={{ paddingLeft: '36px', height: '36px', fontSize: '13px' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#475569', marginLeft: 'auto' }}>{filtered.length} results</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(5).fill(0).map((_, j) => (
                        <td key={j}><div className="shimmer" style={{ height: '20px', borderRadius: '4px' }} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '56px', color: '#475569' }}>
                      <Users size={40} style={{ margin: '0 auto 16px', opacity: 0.2, display: 'block' }} />
                      {total === 0 ? 'No users found. The users endpoint may not be available.' : 'No matching users.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: '700', color: 'white', flexShrink: 0,
                          }}>
                            {user.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff' }}>
                              {user.full_name || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={10} />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${roleClass(user.role)}`} style={{ gap: '5px' }}>
                          {roleIcon(user.role)}
                          {user.role?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: user.is_active !== false ? '#34d399' : '#f87171',
                          }} />
                          <span style={{ fontSize: '12px', color: user.is_active !== false ? '#34d399' : '#f87171', fontWeight: '600' }}>
                            {user.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                          <Calendar size={11} />
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleStatus(user.id, user.is_active !== false, user.full_name)}
                          disabled={updating === user.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                            cursor: updating === user.id ? 'not-allowed' : 'pointer', border: 'none',
                            background: user.is_active !== false ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
                            color: user.is_active !== false ? '#f87171' : '#34d399',
                          }}
                        >
                          {user.is_active !== false ? <UserX size={12} /> : <UserCheck size={12} />}
                          {updating === user.id ? 'Updating…' : user.is_active !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#475569' }}>Page {page + 1} of {totalPages}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
