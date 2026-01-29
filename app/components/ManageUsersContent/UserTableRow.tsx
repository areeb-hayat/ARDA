// app/components/ManageUsersContent/UserTableRow.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, X, Check, Eye, EyeOff, Key, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { User, EditUserForm } from './types';
import { useTheme } from '@/app/context/ThemeContext';

interface UserTableRowProps {
  user: User;
  departments: string[];
  isEditing: boolean;
  editForm: EditUserForm;
  onStartEdit: (user: User) => void;
  onSaveEdit: (userId: string) => void;
  onCancelEdit: () => void;
  onEditFormChange: (form: EditUserForm) => void;
  onDelete: (userId: string) => void;
  onToggleApproval: (userId: string, currentStatus: boolean) => void;
  onRowClick: (user: User) => void;
}

export default function UserTableRow({
  user,
  departments,
  isEditing,
  editForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditFormChange,
  onDelete,
  onToggleApproval,
  onRowClick
}: UserTableRowProps) {
  const { colors, theme, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  const urgentColors = cardCharacters.urgent;
  const successColors = cardCharacters.completed;
  const warningColors = cardCharacters.interactive;
  const executiveColors = cardCharacters.creative;
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [executiveDepartments, setExecutiveDepartments] = useState<string[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Load executive departments when editing an executive
  useEffect(() => {
    if (isEditing && editForm.isExecutive) {
      loadExecutiveDepartments();
    }
  }, [isEditing, editForm.isExecutive, user._id]);

  const loadExecutiveDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await fetch(`/api/admin/executive-departments?userId=${user._id}`);
      if (response.ok) {
        const data = await response.json();
        setExecutiveDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error loading executive departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword.trim()) {
      alert('Please enter a new password');
      return;
    }

    try {
      const response = await fetch('/api/admin/users/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, newPassword })
      });

      if (response.ok) {
        alert('Password updated successfully');
        setShowPasswordModal(false);
        setNewPassword('');
      } else {
        alert('Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    }
  };

  const handleExecutiveDepartmentToggle = (dept: string) => {
    setExecutiveDepartments(prev => 
      prev.includes(dept) 
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  const handleSaveEdit = async () => {
    // If executive, save department assignments
    if (editForm.isExecutive) {
      try {
        await fetch('/api/admin/executive-departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user._id,
            username: user.username,
            departments: executiveDepartments
          })
        });
      } catch (error) {
        console.error('Error saving executive departments:', error);
      }
    }
    
    // Call parent save handler
    onSaveEdit(user._id);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) {
      return;
    }
    if (!isEditing) {
      onRowClick(user);
    }
  };

  const getRoleBadge = () => {
    if (user.isExecutive) {
      return (
        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold border ${executiveColors.border} ${executiveColors.bg} ${executiveColors.text}`}>
          Executive
        </span>
      );
    }
    if (user.isDeptHead) {
      return (
        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold border ${warningColors.border} ${warningColors.bg} ${warningColors.text}`}>
          Dept Head
        </span>
      );
    }
    return (
      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs border ${cardCharacters.neutral.border} ${cardCharacters.neutral.bg} ${cardCharacters.neutral.text}`}>
        Employee
      </span>
    );
  };

  if (isEditing) {
    return (
      <>
        <tr className={`${charColors.hoverBg} transition-colors`}>
          <td className={`px-4 py-3 ${colors.textPrimary} font-semibold whitespace-nowrap text-sm`}>
            {user.employeeNumber || 'N/A'}
          </td>
          <td className={`px-4 py-3 ${colors.textPrimary} font-semibold whitespace-nowrap text-sm`}>
            {user.basicDetails?.name || 'N/A'}
          </td>
          <td className={`px-4 py-3 ${charColors.accent} whitespace-nowrap text-sm`}>
            {user.username}
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <input
              type="text"
              list="departments-list"
              value={editForm.department}
              onChange={(e) => onEditFormChange({ ...editForm, department: e.target.value })}
              className={`px-2 py-1.5 rounded border-2 text-xs w-full ${colors.inputBg} ${colors.inputBorder} ${colors.inputText}`}
              placeholder="Type or select department"
              disabled={editForm.isExecutive === true}
            />
            <datalist id="departments-list">
              {departments.map(dept => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
            {editForm.isExecutive && (
              <p className={`text-[10px] ${colors.textMuted} mt-0.5`}>
                Executive home dept
              </p>
            )}
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => onEditFormChange({ ...editForm, title: e.target.value })}
              className={`px-2 py-1.5 rounded border-2 text-xs w-full ${colors.inputBg} ${colors.inputBorder} ${colors.inputText}`}
            />
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={editForm.isExecutive || false}
                  onChange={(e) => {
                    const isExec = e.target.checked;
                    onEditFormChange({ 
                      ...editForm, 
                      isExecutive: isExec,
                      isDeptHead: isExec ? false : editForm.isDeptHead // Clear dept head if executive
                    });
                    if (!isExec) {
                      setExecutiveDepartments([]);
                    }
                  }}
                  className={`w-3.5 h-3.5 rounded ${theme === 'light' ? 'accent-purple-600' : 'accent-purple-400'}`}
                />
                <span className={`${executiveColors.text} text-xs font-bold`}>Executive</span>
              </label>
              {!editForm.isExecutive && (
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={editForm.isDeptHead || false}
                    onChange={(e) => onEditFormChange({ ...editForm, isDeptHead: e.target.checked })}
                    className={`w-3.5 h-3.5 rounded ${theme === 'light' ? 'accent-blue-600' : 'accent-blue-400'}`}
                  />
                  <span className={`${colors.textPrimary} text-xs`}>Dept Head</span>
                </label>
              )}
            </div>
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={editForm.isApproved || false}
                onChange={(e) => onEditFormChange({ ...editForm, isApproved: e.target.checked })}
                className={`w-3.5 h-3.5 rounded ${theme === 'light' ? 'accent-blue-600' : 'accent-blue-400'}`}
              />
              <span className={`${colors.textPrimary} text-xs`}>Approved</span>
            </label>
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="flex gap-1.5">
              <button
                onClick={handleSaveEdit}
                className={`group relative p-1.5 rounded-lg transition-all hover:scale-105 overflow-hidden border-2 ${successColors.border} ${successColors.bg}`}
                title="Save"
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 14px ${colors.glowSuccess}` }}
                ></div>
                <Check className={`h-3.5 w-3.5 relative z-10 ${successColors.iconColor}`} />
              </button>
              <button
                onClick={onCancelEdit}
                className={`group relative p-1.5 rounded-lg transition-all hover:scale-105 overflow-hidden border-2 ${urgentColors.border} ${urgentColors.bg}`}
                title="Cancel"
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 14px ${colors.glowWarning}` }}
                ></div>
                <X className={`h-3.5 w-3.5 relative z-10 ${urgentColors.iconColor}`} />
              </button>
            </div>
          </td>
        </tr>
        
        {/* Executive Department Selection Row */}
        {editForm.isExecutive && (
          <tr className={`${charColors.hoverBg}`}>
            <td colSpan={8} className="px-4 py-3">
              <div className={`p-3 rounded-lg border-2 ${executiveColors.border} ${executiveColors.bg} bg-opacity-20`}>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className={`h-4 w-4 ${executiveColors.iconColor}`} />
                  <span className={`text-xs font-bold ${executiveColors.text}`}>
                    Executive Department Access
                  </span>
                  <span className={`text-[10px] ${colors.textMuted}`}>
                    ({executiveDepartments.length} selected)
                  </span>
                </div>
                
                {loadingDepartments ? (
                  <p className={`text-xs ${colors.textMuted}`}>Loading departments...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {departments.map(dept => (
                      <label 
                        key={dept}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded border cursor-pointer transition-all ${
                          executiveDepartments.includes(dept)
                            ? `${executiveColors.border} ${executiveColors.bg} ${executiveColors.text}`
                            : `${colors.inputBorder} ${colors.inputBg} ${colors.textSecondary}`
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={executiveDepartments.includes(dept)}
                          onChange={() => handleExecutiveDepartmentToggle(dept)}
                          className={`w-3 h-3 rounded ${theme === 'light' ? 'accent-purple-600' : 'accent-purple-400'}`}
                        />
                        <span className="text-[11px] font-semibold truncate">{dept}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }

  return (
    <>
      <tr 
        onClick={handleRowClick}
        className={`transition-colors cursor-pointer ${charColors.hoverBg}`}
      >
        <td className={`px-4 py-3 ${colors.textPrimary} font-semibold whitespace-nowrap text-sm`}>
          {user.employeeNumber || 'N/A'}
        </td>
        <td className={`px-4 py-3 ${colors.textPrimary} font-semibold whitespace-nowrap text-sm`}>
          {user.basicDetails?.name || 'N/A'}
        </td>
        <td className={`px-4 py-3 ${charColors.accent} whitespace-nowrap text-sm`}>
          {user.username}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold border ${charColors.border} ${charColors.bg} ${charColors.text}`}>
            {user.department}
          </span>
        </td>
        <td className={`px-4 py-3 ${charColors.accent} whitespace-nowrap text-sm`}>
          {user.title || 'N/A'}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {getRoleBadge()}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleApproval(user._id, user.isApproved);
            }}
            className={`group relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold transition-all hover:scale-105 overflow-hidden border ${
              user.isApproved
                ? `${successColors.border} ${successColors.bg} ${successColors.text}`
                : `${warningColors.border} ${warningColors.bg} ${warningColors.text}`
            }`}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 14px ${user.isApproved ? colors.glowSuccess : colors.glowWarning}` }}
            ></div>
            {user.isApproved ? (
              <>
                <CheckCircle className="h-2.5 w-2.5 relative z-10" />
                <span className="relative z-10">Approved</span>
              </>
            ) : (
              <>
                <XCircle className="h-2.5 w-2.5 relative z-10" />
                <span className="relative z-10">Pending</span>
              </>
            )}
          </button>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit(user);
              }}
              className={`group relative p-1.5 rounded-lg transition-all hover:scale-105 overflow-hidden border-2 ${charColors.border} ${charColors.bg}`}
              title="Quick Edit"
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
              ></div>
              <Edit2 className={`h-3.5 w-3.5 relative z-10 ${charColors.iconColor}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPasswordModal(true);
              }}
              className={`group relative p-1.5 rounded-lg transition-all hover:scale-105 overflow-hidden border-2 ${warningColors.border} ${warningColors.bg}`}
              title="Reset Password"
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowWarning}` }}
              ></div>
              <Key className={`h-3.5 w-3.5 relative z-10 ${warningColors.iconColor}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user._id);
              }}
              className={`group relative p-1.5 rounded-lg transition-all hover:scale-105 overflow-hidden border-2 ${urgentColors.border} ${urgentColors.bg}`}
              title="Delete User"
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px rgba(239, 68, 68, 0.2)` }}
              ></div>
              <Trash2 className={`h-3.5 w-3.5 relative z-10 ${urgentColors.iconColor}`} />
            </button>
          </div>
        </td>
      </tr>

      {/* Password Modal */}
      {showPasswordModal && (
        <tr>
          <td colSpan={8}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-3">
              <div className={`relative overflow-hidden rounded-xl border-2 p-5 max-w-md w-full ${colors.shadowDropdown} ${warningColors.border} ${theme === 'light' ? 'bg-white' : `bg-gradient-to-br ${colors.cardBg}`}`}>
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${warningColors.bg}`}>
                        <Key className={`h-5 w-5 ${warningColors.iconColor}`} />
                      </div>
                      <h3 className={`text-lg font-black ${colors.textPrimary}`}>Reset Password</h3>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className={`group relative p-2 rounded-lg transition-all hover:scale-105 overflow-hidden border-2 ${charColors.border} ${charColors.hoverBg}`}
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                      ></div>
                      <X className={`h-5 w-5 relative z-10 ${charColors.iconColor}`} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className={`${charColors.accent} mb-1.5 text-sm`}>
                      User: <span className="font-bold">{user.basicDetails?.name || user.username}</span>
                    </p>
                    <p className={`${colors.textMuted} text-xs mb-3`}>Enter a new password for this user</p>
                    
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className={`w-full px-3 py-2.5 rounded-lg border-2 pr-10 text-sm ${colors.inputBg} ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} ${colors.inputFocusBg} focus:outline-none focus:${colors.borderStrong}`}
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${colors.inputBg} hover:${colors.inputFocusBg}`}
                      >
                        {showPassword ? (
                          <EyeOff className={`h-4 w-4 ${colors.textMuted}`} />
                        ) : (
                          <Eye className={`h-4 w-4 ${colors.textMuted}`} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className={`group relative flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-105 overflow-hidden border-2 ${cardCharacters.neutral.border} ${cardCharacters.neutral.bg} ${cardCharacters.neutral.text}`}
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ boxShadow: `inset 0 0 14px rgba(0,0,0,0.1)` }}
                      ></div>
                      <span className="relative z-10">Cancel</span>
                    </button>
                    <button
                      onClick={handlePasswordUpdate}
                      className={`group relative flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-105 overflow-hidden border border-transparent bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
                      ></div>
                      <span className="relative z-10">Update Password</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}