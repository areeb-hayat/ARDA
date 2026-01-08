// ============================================
// app/components/super/workflows/SuperWorkflowForm.tsx
// Form section for super workflow details and access control
// ============================================

import React, { useState, useEffect } from 'react';
import { AlertCircle, Building2, Users as UsersIcon, Globe, ChevronDown, X } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Employee {
  _id: string;
  basicDetails: {
    name: string;
    profileImage?: string;
  };
  title: string;
  department: string;
}

interface AccessControl {
  type: 'organization' | 'departments' | 'specific_users';
  departments?: string[];
  users?: string[];
}

interface Props {
  name: string;
  description: string;
  accessControl: AccessControl;
  employees: Employee[];
  errors: string[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onAccessControlChange: (ac: AccessControl) => void;
}

export default function SuperWorkflowForm({
  name,
  description,
  accessControl,
  employees,
  errors,
  onNameChange,
  onDescriptionChange,
  onAccessControlChange
}: Props) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;

  // Get unique departments
  const departments = Array.from(new Set(employees.map(e => e.department))).sort();

  // Department selection state
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // User selection state
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const filteredUsers = employees.filter(emp =>
    emp.basicDetails.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    emp.title.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const toggleDepartment = (dept: string) => {
    const current = accessControl.departments || [];
    const updated = current.includes(dept)
      ? current.filter(d => d !== dept)
      : [...current, dept];

    onAccessControlChange({
      ...accessControl,
      departments: updated
    });
  };

  const toggleUser = (userId: string) => {
    const current = accessControl.users || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];

    onAccessControlChange({
      ...accessControl,
      users: updated
    });
  };

  const removeUser = (userId: string) => {
    const current = accessControl.users || [];
    onAccessControlChange({
      ...accessControl,
      users: current.filter(id => id !== userId)
    });
  };

  const getSelectedUsers = () => {
    return employees.filter(e => accessControl.users?.includes(e._id));
  };

  return (
    <div className="space-y-4">
      {/* Name Input */}
      <div>
        <label className={`block text-xs font-bold mb-2 ${colors.textSecondary} uppercase tracking-wide`}>
          Functionality Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={`w-full px-4 py-3 rounded-lg text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} focus:outline-none focus:border-[#64B5F6]`}
          placeholder="e.g., Cross-Dept Approval..."
        />
      </div>

      {/* Description */}
      <div>
        <label className={`block text-xs font-bold mb-2 ${colors.textSecondary} uppercase tracking-wide`}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className={`w-full px-4 py-3 rounded-lg text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} focus:outline-none focus:border-[#64B5F6] resize-none`}
          placeholder="Brief description..."
        />
      </div>

      {/* Access Control */}
      <div>
        <label className={`block text-xs font-bold mb-2 ${colors.textSecondary} uppercase tracking-wide`}>
          Who Can Create Tickets? *
        </label>

        {/* Organization-wide */}
        <label
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-2 ${
            accessControl.type === 'organization'
              ? `bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`
              : `${colors.inputBg} border-2 ${colors.inputBorder} hover:${colors.borderHover}`
          }`}
        >
          <input
            type="radio"
            name="accessType"
            checked={accessControl.type === 'organization'}
            onChange={() => onAccessControlChange({ type: 'organization', departments: [], users: [] })}
            className="w-4 h-4"
          />
          <Globe className={`w-5 h-5 ${accessControl.type === 'organization' ? charColors.iconColor : colors.textMuted}`} />
          <div className="flex-1">
            <p className={`text-sm font-bold ${colors.textPrimary}`}>
              Everyone in Organization
            </p>
            <p className={`text-xs ${colors.textSecondary}`}>
              All employees can create tickets
            </p>
          </div>
        </label>

        {/* Specific Departments */}
        <label
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-2 ${
            accessControl.type === 'departments'
              ? `bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`
              : `${colors.inputBg} border-2 ${colors.inputBorder} hover:${colors.borderHover}`
          }`}
        >
          <input
            type="radio"
            name="accessType"
            checked={accessControl.type === 'departments'}
            onChange={() => onAccessControlChange({ type: 'departments', departments: [], users: [] })}
            className="w-4 h-4"
          />
          <Building2 className={`w-5 h-5 ${accessControl.type === 'departments' ? charColors.iconColor : colors.textMuted}`} />
          <div className="flex-1">
            <p className={`text-sm font-bold ${colors.textPrimary}`}>
              Specific Departments
            </p>
            <p className={`text-xs ${colors.textSecondary}`}>
              Only selected departments
            </p>
          </div>
        </label>

        {/* Department Selection */}
        {accessControl.type === 'departments' && (
          <div className="ml-11 mb-2">
            <div className="relative">
              <button
                onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                className={`w-full px-4 py-2.5 rounded-lg text-sm flex items-center justify-between ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.textPrimary} hover:${colors.borderHover}`}
              >
                <span>
                  {accessControl.departments && accessControl.departments.length > 0
                    ? `${accessControl.departments.length} department${accessControl.departments.length !== 1 ? 's' : ''} selected`
                    : 'Select departments...'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDeptDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDeptDropdown && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg border-2 ${colors.inputBorder} ${colors.inputBg} max-h-48 overflow-y-auto ${colors.shadowCard}`}>
                  {departments.map(dept => (
                    <label
                      key={dept}
                      className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:${colors.cardBgHover} transition-colors ${colors.textPrimary}`}
                    >
                      <input
                        type="checkbox"
                        checked={accessControl.departments?.includes(dept)}
                        onChange={() => toggleDepartment(dept)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{dept}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {accessControl.departments && accessControl.departments.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {accessControl.departments.map(dept => (
                  <span
                    key={dept}
                    className={`px-2 py-1 rounded text-xs font-bold ${colors.inputBg} ${colors.textPrimary} border ${colors.inputBorder}`}
                  >
                    {dept}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Specific Users */}
        <label
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
            accessControl.type === 'specific_users'
              ? `bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`
              : `${colors.inputBg} border-2 ${colors.inputBorder} hover:${colors.borderHover}`
          }`}
        >
          <input
            type="radio"
            name="accessType"
            checked={accessControl.type === 'specific_users'}
            onChange={() => onAccessControlChange({ type: 'specific_users', departments: [], users: [] })}
            className="w-4 h-4"
          />
          <UsersIcon className={`w-5 h-5 ${accessControl.type === 'specific_users' ? charColors.iconColor : colors.textMuted}`} />
          <div className="flex-1">
            <p className={`text-sm font-bold ${colors.textPrimary}`}>
              Specific Users
            </p>
            <p className={`text-xs ${colors.textSecondary}`}>
              Only selected employees
            </p>
          </div>
        </label>

        {/* User Selection */}
        {accessControl.type === 'specific_users' && (
          <div className="ml-11">
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`w-full px-4 py-2.5 rounded-lg text-sm flex items-center justify-between ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.textPrimary} hover:${colors.borderHover}`}
              >
                <span>
                  {accessControl.users && accessControl.users.length > 0
                    ? `${accessControl.users.length} user${accessControl.users.length !== 1 ? 's' : ''} selected`
                    : 'Select users...'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showUserDropdown && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg border-2 ${colors.inputBorder} ${colors.inputBg} ${colors.shadowCard}`}>
                  <div className="p-2 border-b" style={{ borderColor: colors.border.replace('border-', '') }}>
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className={`w-full px-3 py-2 rounded text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.textPrimary} focus:outline-none`}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredUsers.map(emp => (
                      <label
                        key={emp._id}
                        className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:${colors.cardBgHover} transition-colors`}
                      >
                        <input
                          type="checkbox"
                          checked={accessControl.users?.includes(emp._id)}
                          onChange={() => toggleUser(emp._id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${colors.textPrimary}`}>
                            {emp.basicDetails.name}
                          </p>
                          <p className={`text-xs ${colors.textSecondary}`}>
                            {emp.title} • {emp.department}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Users */}
            {accessControl.users && accessControl.users.length > 0 && (
              <div className="space-y-1 mt-2">
                {getSelectedUsers().map(emp => (
                  <div
                    key={emp._id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.inputBg} border ${colors.inputBorder}`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${charColors.iconColor.replace('text-', '')}, ${charColors.accent.replace('text-', '')})` }}
                    >
                      {emp.basicDetails.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${colors.textPrimary} truncate`}>
                        {emp.basicDetails.name}
                      </p>
                      <p className={`text-[10px] ${colors.textSecondary} truncate`}>
                        {emp.department}
                      </p>
                    </div>
                    <button
                      onClick={() => removeUser(emp._id)}
                      className={`${colors.textMuted} hover:text-red-500 transition-colors`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className={`relative overflow-hidden p-3 rounded-lg border-2 ${cardCharacters.urgent.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
          <div className="relative flex items-start gap-2">
            <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cardCharacters.urgent.iconColor}`} />
            <div className="space-y-1">
              {errors.map((err, i) => (
                <p key={i} className={`text-xs ${cardCharacters.urgent.text}`}>{err}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}