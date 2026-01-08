// app/(Dashboard)/hr-employee/components/HRManageUsersContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Users, Upload, ArrowLeft, RefreshCw, Filter, Search, X } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import UserTableRow from '@/app/components/ManageUsersContent/UserTableRow';
import BulkUserUpload from '@/app/components/ManageUsersContent/BulkUserUpload';
import UserDetailModal from '@/app/components/ManageUsersContent/UserDetailModal';
import { User, EditUserForm, UserFilters as FilterTypes } from '@/app/components/ManageUsersContent/types';

interface ManageUsersContentProps {
  initialFilter?: string;
  onBack?: () => void;
}

export default function ManageUsersContent({ initialFilter, onBack }: ManageUsersContentProps) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  // Filters state
  const [filters, setFilters] = useState<FilterTypes>({
    searchTerm: '',
    departmentFilter: 'all',
    approvalFilter: initialFilter === 'unapproved' ? 'unapproved' : 'all',
    roleFilter: 'all',
    sortBy: 'name'
  });

  // Edit user state
  const [editUser, setEditUser] = useState<EditUserForm>({
    department: '',
    title: '',
    isDeptHead: false,
    isApproved: false
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, filters]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = users;

    if (filters.searchTerm) {
      filtered = filtered.filter(user =>
        user.basicDetails?.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        user.employeeNumber?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        user.contactInformation?.email?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.departmentFilter !== 'all') {
      filtered = filtered.filter(user => user.department === filters.departmentFilter);
    }

    if (filters.approvalFilter !== 'all') {
      filtered = filtered.filter(user => 
        filters.approvalFilter === 'approved' ? user.isApproved : !user.isApproved
      );
    }

    if (filters.roleFilter !== 'all') {
      filtered = filtered.filter(user =>
        filters.roleFilter === 'depthead' ? user.isDeptHead : !user.isDeptHead
      );
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          const nameA = a.basicDetails?.name || '';
          const nameB = b.basicDetails?.name || '';
          return nameA.localeCompare(nameB);
        case 'department':
          return (a.department || '').localeCompare(b.department || '');
        case 'employeeNumber':
          return (a.employeeNumber || '').localeCompare(b.employeeNumber || '');
        case 'status':
          return (b.isApproved ? 1 : 0) - (a.isApproved ? 1 : 0);
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  const updateUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...editUser })
      });

      if (response.ok) {
        setEditingUser(null);
        fetchUsers();
        alert('User updated successfully');
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchUsers();
        alert('User deleted successfully');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users/approval', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isApproved: !currentStatus })
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert('Failed to update approval status');
      }
    } catch (error) {
      console.error('Error toggling approval:', error);
      alert('Failed to update approval status');
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user._id);
    setEditUser({
      department: user.department,
      title: user.title,
      isDeptHead: user.isDeptHead,
      isApproved: user.isApproved
    });
  };

  const handleFilterChange = (newFilters: Partial<FilterTypes>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRowClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  const handleUpdateUser = () => {
    fetchUsers();
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      departmentFilter: 'all',
      approvalFilter: 'all',
      roleFilter: 'all',
      sortBy: 'name'
    });
  };

  const activeFiltersCount = [
    filters.searchTerm,
    filters.departmentFilter !== 'all' ? filters.departmentFilter : '',
    filters.approvalFilter !== 'all' ? filters.approvalFilter : '',
    filters.roleFilter !== 'all' ? filters.roleFilter : ''
  ].filter(Boolean).length;

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <h2 className={`text-xl font-black ${charColors.text} mb-2`}>Manage Users</h2>
            <p className={`text-sm ${colors.textMuted}`}>Loading users...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse`} style={{ backgroundColor: charColors.iconColor.replace('text-', '') }} />
              <div className={`relative w-12 h-12 border-4 ${colors.borderStrong} border-t-transparent rounded-full animate-spin mx-auto`}></div>
            </div>
            <p className={`${colors.textSecondary} text-sm font-semibold`}>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4">
      {/* Header with Back Button and Refresh */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} transition-all duration-300`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <button
                  onClick={handleBack}
                  className={`group relative flex items-center justify-center p-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${charColors.border} ${colors.borderHover} backdrop-blur-sm ${colors.shadowCard} hover:${colors.shadowHover}`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
                  ></div>
                  <ArrowLeft className={`h-5 w-5 relative z-10 transition-transform duration-300 group-hover:-translate-x-1 ${charColors.iconColor}`} />
                </button>
              )}

              <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg}`}>
                <Users className={`h-5 w-5 ${charColors.iconColor}`} />
              </div>
              <div>
                <h1 className={`text-xl font-black ${charColors.text}`}>Manage Users</h1>
                <p className={`text-xs ${colors.textMuted}`}>
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                  {filters.approvalFilter === 'unapproved' && ' (Pending Approval)'}
                </p>
              </div>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className={`group relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} border border-transparent ${colors.shadowCard} hover:${colors.shadowHover} disabled:opacity-50`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
              ></div>
              <RefreshCw className={`h-4 w-4 relative z-10 transition-transform duration-300 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span className="text-sm font-bold relative z-10">Refresh</span>
            </button>
          </div>

          {/* Filters Section */}
          <div className={`p-3 rounded-lg border ${charColors.border} bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm`}>
            <div className="flex items-center space-x-2 mb-2">
              <Filter className={`h-4 w-4 ${colors.textMuted}`} />
              <span className={`text-xs font-bold ${colors.textSecondary}`}>Filters:</span>
            </div>
            
            {/* Search Bar */}
            <div className="mb-3">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                  placeholder="Search by name, username, email, or employee #..."
                  className={`w-full pl-10 pr-10 py-2 rounded-lg text-sm transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
                />
                {filters.searchTerm && (
                  <button
                    onClick={() => handleFilterChange({ searchTerm: '' })}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${colors.textMuted} hover:${cardCharacters.urgent.iconColor} transition-colors`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Department Filter */}
              <select
                value={filters.departmentFilter}
                onChange={(e) => handleFilterChange({ departmentFilter: e.target.value })}
                className={`px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Approval Filter */}
              <select
                value={filters.approvalFilter}
                onChange={(e) => handleFilterChange({ approvalFilter: e.target.value as any })}
                className={`px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="unapproved">Pending Approval</option>
              </select>

              {/* Role Filter */}
              <select
                value={filters.roleFilter}
                onChange={(e) => handleFilterChange({ roleFilter: e.target.value as any })}
                className={`px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
              >
                <option value="all">All Roles</option>
                <option value="depthead">Dept Heads</option>
                <option value="employee">Employees</option>
              </select>

              {/* Sort By */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                className={`px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
              >
                <option value="name">Sort: Name</option>
                <option value="department">Sort: Department</option>
                <option value="employeeNumber">Sort: Employee #</option>
                <option value="status">Sort: Status</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={clearFilters}
                  className={`group relative px-4 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 hover:scale-105 overflow-hidden border ${cardCharacters.urgent.border} ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}`}
                >
                  Clear Filters ({activeFiltersCount})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUserUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          departments={departments}
          onClose={handleCloseModal}
          onUpdate={handleUpdateUser}
        />
      )}

      {/* Users Table */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative overflow-x-auto">
          <table className="w-full">
            <thead className={`bg-gradient-to-br ${charColors.bg} border-b ${charColors.border}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-black ${charColors.text} uppercase tracking-wider whitespace-nowrap`}>
                  Employee #
                </th>
                <th className={`px-4 py-3 text-left text-xs font-black ${charColors.text} uppercase tracking-wider whitespace-nowrap`}>
                  Name
                </th>
                <th className={`px-4 py-3 text-left text-xs font-black ${charColors.text} uppercase tracking-wider whitespace-nowrap`}>
                  Username
                </th>
                <th className={`px-4 py-3 text-left text-xs font-black ${charColors.text} uppercase tracking-wider whitespace-nowrap`}>
                  Department
                </th>
                <th className={`px-4 py-3 text-left text-xs font-black ${charColors.text} uppercase tracking-wider whitespace-nowrap`}>
                  Title
                </th>
                <th className={`px-4 py-3 text-left text-xs font-black ${charColors.text} uppercase tracking-wider whitespace-nowrap`}>
                  Role
                </th>
                <th className={`px-4 py-3 text-left text-xs font-black ${charColors.text} uppercase tracking-wider whitespace-nowrap`}>
                  Status
                </th>
                <th className={`px-4 py-3 text-left text-xs font-black ${charColors.text} uppercase tracking-wider whitespace-nowrap`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${charColors.border}`}>
              {filteredUsers.map((user) => (
                <UserTableRow
                  key={user._id}
                  user={user}
                  departments={departments}
                  isEditing={editingUser === user._id}
                  editForm={editUser}
                  onStartEdit={startEdit}
                  onSaveEdit={updateUser}
                  onCancelEdit={() => setEditingUser(null)}
                  onEditFormChange={setEditUser}
                  onDelete={deleteUser}
                  onToggleApproval={toggleApproval}
                  onRowClick={handleRowClick}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="relative text-center py-16">
            <Users className={`h-12 w-12 ${colors.textMuted} mx-auto mb-3 opacity-40`} />
            <p className={`${colors.textPrimary} text-base font-semibold mb-2`}>No users found</p>
            <p className={`${colors.textMuted} text-sm`}>
              {users.length === 0 
                ? 'Upload a CSV or Excel file to add users' 
                : 'Try adjusting your filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}