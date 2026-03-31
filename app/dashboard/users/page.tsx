'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, handleApiError } from '@/lib/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { FEATURE_CONFIG, getDefaultFeaturesForRole, mergeFeatureAccess, type FeatureId } from '@/lib/permissions';
import {
  Users, Search, RefreshCw, UserCheck, UserX,
  Shield, GraduationCap, ChevronLeft, ChevronRight,
  Mail, Calendar, Lock, Eye, EyeOff, Plus, X, Zap,
} from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userAccess, setUserAccess] = useState<Record<string, boolean>>({});
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerData, setRegisterData] = useState({ email: '', full_name: '', password: '', role: 'student' });
  const [registering, setRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [limit, setLimit] = useState<number | 'all'>(15);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [roleCounts, setRoleCounts] = useState({ admin: 0, faculty: 0, student: 0 });

  // Check user role on mount - only admins can access this page
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      toast.error('Admin access required. Redirecting...');
      router.push('/dashboard');
    }
  }, [router]);

  const AVAILABLE_FEATURES = Object.entries(FEATURE_CONFIG).map(([id, config]) => ({
    id: id as FeatureId,
    name: config.name,
    icon: '✓',
    roles: config.roles,
  }));

  // Helper: Get features allowed for a specific role
  const getFeaturesForRole = (role: string) => {
    return AVAILABLE_FEATURES.filter(f => f.roles.includes(role as any));
  };

  // Helper: Get default access for a role (all features enabled by default)
  const getDefaultAccessForRole = (role: string) => {
    return getDefaultFeaturesForRole(role as 'admin' | 'faculty' | 'student');
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return '#ef4444';
    if (strength <= 2) return '#f97316';
    if (strength <= 3) return '#eab308';
    if (strength <= 4) return '#84cc16';
    return '#22c55e';
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    if (strength <= 4) return 'Strong';
    return 'Very Strong';
  };

  const handlePasswordChange = (password: string) => {
    setRegisterData({ ...registerData, password });
    setPasswordStrength(calculatePasswordStrength(password));
  };

  useEffect(() => { fetchUsers(); }, [page, limit]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users to calculate accurate role counts
      const allData = await adminAPI.getUsers(0, 10000);
      const allUsersList = allData.users || [];
      setAllUsers(allUsersList);
      setTotal(allData.total || 0);
      
      // Calculate role counts from ALL users
      const counts = {
        admin: allUsersList.filter(u => u.role === 'admin').length,
        faculty: allUsersList.filter(u => u.role === 'faculty').length,
        student: allUsersList.filter(u => u.role === 'student').length,
      };
      setRoleCounts(counts);
      
      // Get paginated data for display
      if (limit === 'all') {
        setUsers(allUsersList);
        setPage(0);
      } else {
        const numLimit = parseInt(String(limit));
        const paginatedData = await adminAPI.getUsers(page * numLimit, numLimit);
        setUsers(paginatedData.users || []);
      }
    } catch (err) {
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

  const changeRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      await adminAPI.changeUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
      if (selectedUser?.id === userId) {
        // Update selectedUser with new role
        const updatedUser = { ...selectedUser, role: newRole };
        setSelectedUser(updatedUser);
        
        // IMPORTANT: Update feature access to only include features for the new role
        setUserAccess(getDefaultAccessForRole(newRole));
      }
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setUpdating(null);
    }
  };

  const openUserDetails = async (user: any) => {
    setSelectedUser(user);
    setLoadingAccess(true);
    try {
      const access = await adminAPI.getUserAccess(user.id);
      // IMPORTANT: Filter features to only include those allowed for this user's role
      const roleFeatures = getFeaturesForRole(user.role);
      
      // Merge: keep only features that this role is allowed to have
      const filteredAccess: Record<string, boolean> = {};
      Object.entries(access.features || {}).forEach(([featureId, value]) => {
        if (roleFeatures.some(f => f.id === featureId)) {
          filteredAccess[featureId] = value as boolean;
        }
      });
      
      // Add any missing role features with default true
      roleFeatures.forEach(f => {
        if (!(f.id in filteredAccess)) {
          filteredAccess[f.id] = true;
        }
      });
      
      setUserAccess(filteredAccess);
    } catch (err) {
      setUserAccess(getDefaultAccessForRole(user.role));
    } finally {
      setLoadingAccess(false);
    }
  };

  const saveAccessChanges = async () => {
    if (!selectedUser) return;
    setLoadingAccess(true);
    try {
      // IMPORTANT: Only save features that are allowed for this user's role
      const allowedFeatures = getFeaturesForRole(selectedUser.role).map(f => f.id);
      
      const cleanedAccess: Record<string, boolean> = {};
      allowedFeatures.forEach(featureId => {
        if (featureId in userAccess) {
          cleanedAccess[featureId] = userAccess[featureId];
        }
      });
      
      await adminAPI.updateUserAccess(selectedUser.id, cleanedAccess);
      toast.success(`Access updated for ${selectedUser.full_name}`);
      
      // ✨ IMPORTANT: If this is the currently logged-in user, update their localStorage
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const parsedCurrentUser = JSON.parse(currentUser);
        if (parsedCurrentUser.id === selectedUser.id) {
          // Update the current user's features_access in localStorage
          parsedCurrentUser.features_access = cleanedAccess;
          localStorage.setItem('user', JSON.stringify(parsedCurrentUser));
          console.log('✅ Updated current user permissions in localStorage:', cleanedAccess);
          
          // Dispatch storage event to notify other components (like Sidebar) of the change
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'user',
            newValue: JSON.stringify(parsedCurrentUser),
            oldValue: currentUser,
            storageArea: localStorage,
            url: window.location.href,
          }));
          
          // Optional: Show message to user
          toast.info('Your permissions have been updated. Some menu items may have changed.');
        }
      }
      
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setLoadingAccess(false);
    }
  };

  const registerNewUser = async () => {
    if (!registerData.email || !registerData.full_name || !registerData.password) {
      toast.error('Email, full name, and password are required');
      return;
    }

    if (passwordStrength < 3) {
      toast.error('Password must be at least Good strength');
      return;
    }
    
    // Log state BEFORE sending
    console.log('📊 registerData state object:', registerData);
    console.log('   type of registerData:', typeof registerData);
    console.log('   registerData keys:', Object.keys(registerData));
    console.log('   registerData.email:', registerData.email);
    console.log('   registerData.full_name:', registerData.full_name);
    console.log('   registerData.role:', registerData.role);
    console.log('   registerData.password:', `***${registerData.password.substring(registerData.password.length - 3)}`);
    
    // Create the payload to send
    const payload = {
      email: registerData.email,
      full_name: registerData.full_name,
      password: registerData.password,
      role: registerData.role,
    };
    
    console.log('📤 Payload about to be sent:',JSON.stringify(payload));
    console.log('   Payload keys:', Object.keys(payload));
    
    setRegistering(true);
    try {
      await adminAPI.registerUser(payload);
      toast.success(`User ${registerData.full_name} registered successfully!`);
      setShowRegisterModal(false);
      setRegisterData({ email: '', full_name: '', password: '', role: 'student' });
      setPasswordStrength(0);
      setPage(0);
      fetchUsers();
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setRegistering(false);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = limit === 'all' ? 1 : Math.ceil(total / parseInt(String(limit)));

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return '🛡️';
    if (role === 'faculty') return '👨‍🏫';
    return '👨‍🎓';
  };

  const getRoleColor = (role: string) => {
    if (role === 'admin') return { bg: '#1e3a8a', text: '#3b82f6', border: '#3b82f6' };
    if (role === 'faculty') return { bg: '#312e81', text: '#a855f7', border: '#a855f7' };
    return { bg: '#1a4d3e', text: '#34d399', border: '#34d399' };
  };

  const stats = [
    { label: 'Total Users', value: total, color: '#3b82f6', icon: Users },
    { label: 'Admins', value: roleCounts.admin, color: '#3b82f6', icon: Shield },
    { label: 'Faculty', value: roleCounts.faculty, color: '#a855f7', icon: GraduationCap },
    { label: 'Students', value: roleCounts.student, color: '#34d399', icon: Users },
  ];

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', paddingBottom: '40px' }}>
      <Header
        title="User Management"
        subtitle={`${total} registered users • Manage roles & access`}
        actions={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Pagination limit selector */}
            <select
              value={limit}
              onChange={(e) => { setLimit(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setPage(0); }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: '#1e293b',
                color: '#f0f4ff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <option value={30}>30 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value="all">All Users</option>
            </select>
            
            <motion.button 
              onClick={() => { setShowRegisterModal(true); setRegisterData({ email: '', full_name: '', password: '', role: 'student' }); setPasswordStrength(0); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary" 
              style={{ fontSize: '13px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px', background: '#3b82f6', border: 'none', fontWeight: '600' }}
            >
              <Plus size={16} /> Add User
            </motion.button>
            <motion.button 
              onClick={fetchUsers} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary" 
              style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '10px' }}
            >
              <RefreshCw size={14} />
            </motion.button>
          </div>
        }
      />

      <div style={{ padding: '32px' }}>
        {/* Stats Section */}
        <motion.div 
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}
        >
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div 
                key={i} 
                whileHover={{ y: -5 }}
                style={{
                  padding: '24px', borderRadius: '12px',
                  background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'flex-end', gap: '16px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px',
                  background: '#0f172a', border: `2px solid ${s.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={28} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#f0f4ff' }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>{s.label}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Register User Modal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showRegisterModal ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0,
            background: showRegisterModal ? 'rgba(0,0,0,0.7)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            pointerEvents: showRegisterModal ? 'auto' : 'none',
          }}
          onClick={() => setShowRegisterModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: showRegisterModal ? 1 : 0.9, opacity: showRegisterModal ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: '#1e293b', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.15)',
              padding: '36px', maxWidth: '500px', width: '90vw',
              boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#f0f4ff', margin: 0 }}>
                🎉 Register New User
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '8px 0 0 0' }}>
                Create a new user account with secure password
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
              {/* Debug Display */}
              <div style={{
                padding: '12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid #3b82f6', fontSize: '11px', color: '#3b82f6', fontFamily: 'monospace'
              }}>
                <div><strong>📊 Current State:</strong></div>
                <div>email: {registerData.email || '(empty)'}</div>
                <div>full_name: {registerData.full_name || '(empty)'}</div>
                <div>role: <strong style={{color: '#a855f7'}}>{registerData.role}</strong></div>
                <div>password strength: {passwordStrength}/5</div>
              </div>
              
              {/* Email */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="user@example.com"
                    disabled={registering}
                    style={{
                      width: '100%', paddingLeft: '40px', paddingRight: '14px', height: '44px',
                      borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                      background: '#0f172a', color: '#f0f4ff', fontSize: '13px',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={registerData.full_name}
                  onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                  placeholder="John Doe"
                  disabled={registering}
                  style={{
                    width: '100%', padding: '12px 14px', height: '44px',
                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                    background: '#0f172a', color: '#f0f4ff', fontSize: '13px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Password
                </label>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter secure password"
                    disabled={registering}
                    style={{
                      width: '100%', paddingLeft: '40px', paddingRight: '44px', height: '44px',
                      borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                      background: '#0f172a', color: '#f0f4ff', fontSize: '13px',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {registerData.password && (
                  <div style={{
                    paddingBottom: '8px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          background: getPasswordStrengthColor(passwordStrength),
                          width: `${(passwordStrength / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', color: getPasswordStrengthColor(passwordStrength),
                      minWidth: '50px',
                    }}>
                      {getPasswordStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { value: 'student', label: '👨‍🎓 Student', color: '#34d399' },
                    { value: 'faculty', label: '👨‍🏫 Faculty', color: '#a855f7' },
                    { value: 'admin', label: '🛡️ Admin', color: '#3b82f6' },
                  ].map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setRegisterData({ ...registerData, role: role.value })}
                      style={{
                        padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                        border: registerData.role === role.value ? `2px solid ${role.color}` : '1px solid rgba(255,255,255,0.1)',
                        background: registerData.role === role.value ? '#0f172a' : '#0f172a',
                        color: registerData.role === role.value ? role.color : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={registerNewUser}
                disabled={registering || !registerData.email || !registerData.full_name || !registerData.password}
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                  border: 'none', background: '#3b82f6', color: '#f0f4ff',
                  cursor: registering ? 'not-allowed' : 'pointer',
                  opacity: registering || !registerData.email || !registerData.full_name || !registerData.password ? 0.6 : 1,
                }}
              >
                {registering ? '⏳ Registering...' : '✅ Register User'}
              </button>
              <button
                onClick={() => setShowRegisterModal(false)}
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                  color: '#f0f4ff', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* User Details Modal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: selectedUser ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0,
            background: selectedUser ? 'rgba(0,0,0,0.7)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            pointerEvents: selectedUser ? 'auto' : 'none',
          }}
          onClick={() => setSelectedUser(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: selectedUser ? 1 : 0.9, opacity: selectedUser ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: '#1e293b', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.15)',
              padding: '36px', maxWidth: '620px', width: '90vw',
              maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedUser && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '12px',
                    background: getRoleColor(selectedUser.role).bg,
                    color: getRoleColor(selectedUser.role).text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '32px', fontWeight: '700',
                    margin: '0 auto 16px',
                    border: `2px solid ${getRoleColor(selectedUser.role).text}`,
                  }}>
                    {selectedUser.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f0f4ff', margin: '0 0 6px 0' }}>
                    {selectedUser.full_name}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    {selectedUser.email}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {/* Role Section */}
                  <div
                    style={{
                      padding: '20px', borderRadius: '12px',
                      background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase' }}>
                      👤 Current Role
                    </div>
                    <div style={{
                      fontSize: '20px', fontWeight: '800', color: getRoleColor(selectedUser.role).text,
                      marginBottom: '14px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span>{getRoleIcon(selectedUser.role)}</span>
                      {selectedUser.role?.toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {['student', 'faculty', 'admin'].map((role) => (
                        <button
                          key={role}
                          onClick={() => changeRole(selectedUser.id, role)}
                          disabled={updating === selectedUser.id}
                          style={{
                            padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                            border: selectedUser.role === role ? `2px solid ${getRoleColor(role).text}` : '1px solid rgba(255,255,255,0.1)',
                            background: selectedUser.role === role ? getRoleColor(role).bg : '#0f172a',
                            color: selectedUser.role === role ? getRoleColor(role).text : '#94a3b8',
                            cursor: updating === selectedUser.id ? 'not-allowed' : 'pointer',
                            opacity: updating === selectedUser.id ? 0.5 : 1,
                          }}
                        >
                          {getRoleIcon(role)} {role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Section */}
                  <div
                    style={{
                      padding: '20px', borderRadius: '12px',
                      background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase' }}>
                      🔌 Account Status
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px',
                    }}>
                      <div style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: selectedUser.is_active ? '#34d399' : '#f87171',
                      }} />
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#f0f4ff' }}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStatus(selectedUser.id, selectedUser.is_active, selectedUser.full_name)}
                      disabled={updating === selectedUser.id}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                        border: 'none',
                        background: selectedUser.is_active ? '#1e293b' : '#1e293b',
                        color: selectedUser.is_active ? '#f87171' : '#34d399',
                        borderBottom: `2px solid ${selectedUser.is_active ? '#f87171' : '#34d399'}`,
                        cursor: updating === selectedUser.id ? 'not-allowed' : 'pointer',
                        opacity: updating === selectedUser.id ? 0.5 : 1,
                      }}
                    >
                      {selectedUser.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                    </button>
                  </div>
                </div>

                {/* User Info */}
                <div
                  style={{
                    padding: '20px', borderRadius: '12px',
                    background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '14px', textTransform: 'uppercase' }}>
                    ℹ️ User Information
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <Mail size={16} color="#64748b" style={{ marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Email</div>
                        <div style={{ fontSize: '13px', color: '#f0f4ff', fontWeight: '600' }}>{selectedUser.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <Calendar size={16} color="#64748b" style={{ marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Joined</div>
                        <div style={{ fontSize: '13px', color: '#f0f4ff', fontWeight: '600' }}>
                          {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Access */}
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '14px', textTransform: 'uppercase' }}>
                    🔐 Feature Access ({getFeaturesForRole(selectedUser.role).length})
                  </div>
                  {loadingAccess ? (
                    <div style={{ textAlign: 'center', padding: '32px 20px', color: '#64748b', fontSize: '13px' }}>⏳ Loading features...</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      {getFeaturesForRole(selectedUser.role)
                        .map((feature) => (
                          <div
                            key={feature.id}
                            style={{
                              padding: '14px', borderRadius: '8px',
                              background: userAccess[feature.id] ?? true ? '#0f4d3e' : '#4d1414',
                              border: `1px solid ${userAccess[feature.id] ?? true ? '#34d399' : '#f87171'}`,
                              display: 'flex', alignItems: 'center', gap: '10px',
                              cursor: 'pointer',
                            }}
                            onClick={() => setUserAccess({ ...userAccess, [feature.id]: !(userAccess[feature.id] ?? true) })}
                          >
                            <input
                              type="checkbox"
                              checked={userAccess[feature.id] ?? true}
                              onChange={() => setUserAccess({ ...userAccess, [feature.id]: !(userAccess[feature.id] ?? true) })}
                              disabled={loadingAccess}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px' }}>{feature.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#f0f4ff' }}>{feature.name}</div>
                            </div>
                            <span style={{
                              fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
                              background: userAccess[feature.id] ?? true ? '#064e3b' : '#5f2222',
                              color: userAccess[feature.id] ?? true ? '#34d399' : '#f87171',
                              fontWeight: '700',
                            }}>
                              {userAccess[feature.id] ?? true ? '✓' : '✗'}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={saveAccessChanges}
                    disabled={loadingAccess}
                    style={{
                      flex: 1, padding: '14px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                      border: 'none', background: '#3b82f6', color: '#f0f4ff',
                      cursor: loadingAccess ? 'not-allowed' : 'pointer',
                      opacity: loadingAccess ? 0.6 : 1,
                    }}
                  >
                    {loadingAccess ? '⏳ Saving...' : '💾 Save Changes'}
                  </button>
                  <button
                    onClick={() => setSelectedUser(null)}
                    style={{
                      flex: 1, padding: '14px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                      border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                      color: '#f0f4ff', cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card" style={{
            padding: '0', overflow: 'hidden',
            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
            background: '#1e293b',
          }}
        >
          <div style={{
            padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', gap: '12px', alignItems: 'center',
          }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
              <Search size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or role..."
                style={{
                  width: '100%', paddingLeft: '40px', paddingRight: '14px', height: '40px',
                  borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                  background: '#0f172a', color: '#f0f4ff',
                  fontSize: '13px',
                }}
              />
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              {filtered.length} results
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>User</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Joined</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {Array(6).fill(0).map((_, j) => (
                        <td key={j} style={{ padding: '16px 20px' }}>
                          <div className="shimmer" style={{ height: '20px', borderRadius: '4px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '56px 20px', color: '#475569' }}>
                      <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.2, display: 'block' }} />
                      <div style={{ fontSize: '14px' }}>
                        {total === 0 ? 'No users found. Click "Add User" to register your first user.' : 'No matching users.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px', height: '42px', borderRadius: '8px',
                            background: getRoleColor(user.role).bg,
                            color: getRoleColor(user.role).text,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: '700',
                            border: `1px solid ${getRoleColor(user.role).text}`,
                          }}>
                            {user.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff' }}>
                            {user.full_name || 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {user.email}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{getRoleIcon(user.role)}</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: getRoleColor(user.role).text }}>
                            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: user.is_active ? '#34d399' : '#f87171',
                          }} />
                          <span style={{ fontSize: '12px', color: user.is_active ? '#34d399' : '#f87171', fontWeight: '700' }}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            onClick={() => openUserDetails(user)}
                            disabled={updating === user.id}
                            title="View Details"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              padding: '8px 12px', borderRadius: '6px', fontSize: '14px',
                              cursor: updating === user.id ? 'not-allowed' : 'pointer',
                              border: `1px solid ${getRoleColor(user.role).text}`,
                              background: getRoleColor(user.role).bg,
                              color: getRoleColor(user.role).text,
                              opacity: updating === user.id ? 0.5 : 1,
                              fontWeight: '700',
                            }}
                          >
                            {getRoleIcon(user.role)}
                          </button>

                          <button
                            onClick={() => toggleStatus(user.id, user.is_active, user.full_name)}
                            disabled={updating === user.id}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              padding: '6px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                              cursor: updating === user.id ? 'not-allowed' : 'pointer', border: 'none',
                              background: user.is_active ? '#4d1414' : '#0f4d3e',
                              color: user.is_active ? '#f87171' : '#34d399',
                              opacity: updating === user.id ? 0.5 : 1,
                            }}
                          >
                            {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{
              padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Page {page + 1} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                  style={{
                    padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
                    border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a',
                    color: '#f0f4ff', cursor: page === 0 ? 'not-allowed' : 'pointer',
                    opacity: page === 0 ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
                    border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a',
                    color: '#f0f4ff', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    opacity: page >= totalPages - 1 ? 0.5 : 1,
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
