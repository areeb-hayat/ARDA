// ============================================
// app/components/super/workflows/SuperEmployeePanel.tsx
// Right sidebar for employee/group selection in super workflows
// ============================================

import React, { useState } from 'react';
import { Users, Search, X, UserPlus } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import EmployeeDragItem from '../../universal/WorkflowComponents/EmployeeDragItem';
import GroupDragItem from '../../universal/WorkflowComponents/GroupDragItem';

interface Employee {
  _id: string;
  basicDetails: {
    name: string;
    profileImage?: string;
  };
  title: string;
  department: string;
}

interface GroupData {
  id: string;
  lead: Employee;
  members: Employee[];
}

interface Props {
  employees: Employee[];
  sidebarBg: string;
  modalBorder: string;
}

export default function SuperEmployeePanel({ employees, sidebarBg, modalBorder }: Props) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;

  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupLead, setGroupLead] = useState<string>('');
  const [createdGroups, setCreatedGroups] = useState<GroupData[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Get unique departments
  const departments = Array.from(new Set(employees.map(e => e.department))).sort();

  const filteredEmployees = employees.filter(emp => {
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const matchesSearch =
      emp.basicDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const groupModalEmployees = employees.filter(emp =>
    emp._id !== groupLead &&
    (emp.basicDetails.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
      emp.title.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(groupSearchQuery.toLowerCase()))
  );

  const handleCreateGroup = () => {
    if (selectedMembers.length === 0 || !groupLead) {
      alert('Please select at least one member and a group lead');
      return;
    }

    const leadEmployee = employees.find(e => e._id === groupLead);
    const memberEmployees = selectedMembers
      .map(id => employees.find(e => e._id === id))
      .filter(Boolean) as Employee[];

    if (!leadEmployee) return;

    const newGroup: GroupData = {
      id: `group-${Date.now()}`,
      lead: leadEmployee,
      members: memberEmployees,
    };

    setCreatedGroups(prev => [...prev, newGroup]);
    setShowGroupModal(false);
    setSelectedMembers([]);
    setGroupLead('');
    setGroupSearchQuery('');
  };

  const toggleMemberSelection = (empId: string) => {
    setSelectedMembers(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  return (
    <>
      <div
        className="w-80 relative overflow-hidden border-l-2 flex flex-col"
        style={{
          background: sidebarBg,
          borderColor: modalBorder
        }}
      >
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

        <div className="relative p-6 space-y-4 flex-1 overflow-y-auto">
          <h3 className={`text-lg font-black ${charColors.text} uppercase tracking-wide`}>
            Build Workflow
          </h3>

          {/* Create Group Button */}
          <button
            onClick={() => setShowGroupModal(true)}
            className={`group relative w-full overflow-hidden rounded-lg px-4 py-3 font-bold text-sm transition-all duration-300 bg-gradient-to-r ${cardCharacters.creative.bg} border-2 ${cardCharacters.creative.border} ${cardCharacters.creative.text} flex items-center justify-center gap-2`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: 'inset 0 0 20px rgba(161, 136, 127, 0.2)' }}
            ></div>
            <Users className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12 ${cardCharacters.creative.iconColor}`} />
            <span className="relative z-10">Create Parallel Group</span>
          </button>

          {/* Parallel Groups */}
          {createdGroups.length > 0 && (
            <div className="space-y-2">
              <p className={`text-xs font-bold ${colors.textSecondary} uppercase tracking-wide`}>
                Parallel Groups
              </p>
              <div className="space-y-2">
                {createdGroups.map(group => (
                  <GroupDragItem
                    key={group.id}
                    groupLead={group.lead}
                    members={group.members}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Individual Employees */}
          <div className="space-y-2">
            <p className={`text-xs font-bold ${colors.textSecondary} uppercase tracking-wide`}>
              Individual Employees
            </p>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.textPrimary} focus:outline-none focus:border-[#64B5F6]`}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-sm ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} focus:outline-none focus:border-[#64B5F6]`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${colors.textMuted} hover:${cardCharacters.urgent.iconColor} transition-colors`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Employee List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {filteredEmployees.length === 0 ? (
                <p className={`text-center text-sm ${colors.textSecondary} py-8`}>
                  No employees found
                </p>
              ) : (
                filteredEmployees.map(emp => (
                  <div key={emp._id}>
                    <EmployeeDragItem employee={emp} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-2xl relative overflow-hidden rounded-2xl border-2 ${colors.shadowToast}`}
            style={{
              background: sidebarBg,
              borderColor: cardCharacters.creative.border.replace('border-', '')
            }}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

            <div className="relative p-6">
              <h3 className={`text-2xl font-black ${cardCharacters.creative.text} mb-6`}>
                Create Parallel Group
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={`block ${colors.textSecondary} text-sm font-bold mb-2`}>
                    Group Lead *
                  </label>
                  <select
                    value={groupLead}
                    onChange={(e) => setGroupLead(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg text-sm ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.textPrimary} focus:outline-none focus:border-[#64B5F6]`}
                  >
                    <option value="">Select a group lead...</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.basicDetails.name} - {emp.title} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block ${colors.textSecondary} text-sm font-bold mb-2`}>
                    Group Members *
                  </label>

                  <div className="relative mb-3">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
                    <input
                      type="text"
                      value={groupSearchQuery}
                      onChange={(e) => setGroupSearchQuery(e.target.value)}
                      placeholder="Search members..."
                      className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-sm ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.textPrimary} focus:outline-none focus:border-[#64B5F6]`}
                    />
                    {groupSearchQuery && (
                      <button onClick={() => setGroupSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className={`w-4 h-4 ${colors.textMuted}`} />
                      </button>
                    )}
                  </div>

                  <div className={`max-h-64 overflow-y-auto space-y-2 p-3 rounded-lg border-2 ${colors.inputBorder}`}>
                    {groupModalEmployees.length === 0 ? (
                      <p className={`text-center text-sm ${colors.textSecondary} py-4`}>
                        {groupSearchQuery ? 'No employees found' : 'Select a group lead first'}
                      </p>
                    ) : (
                      groupModalEmployees.map(emp => (
                        <label
                          key={emp._id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            selectedMembers.includes(emp._id)
                              ? `bg-gradient-to-r ${cardCharacters.creative.bg} border-2 ${cardCharacters.creative.border}`
                              : `${colors.inputBg} border-2 ${colors.inputBorder} hover:${colors.borderHover}`
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(emp._id)}
                            onChange={() => toggleMemberSelection(emp._id)}
                            className="w-4 h-4"
                          />
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ background: `linear-gradient(135deg, ${cardCharacters.creative.iconColor.replace('text-', '')}, ${cardCharacters.creative.accent.replace('text-', '')})` }}
                          >
                            {emp.basicDetails.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${colors.textPrimary}`}>
                              {emp.basicDetails.name}
                            </p>
                            <p className={`text-xs ${colors.textSecondary}`}>
                              {emp.title} • {emp.department}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  {selectedMembers.length > 0 && (
                    <p className={`text-sm ${colors.textSecondary} mt-2`}>
                      ✓ {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateGroup}
                  className={`group relative flex-1 overflow-hidden rounded-lg px-6 py-3 font-bold text-sm transition-all duration-300 bg-gradient-to-r ${cardCharacters.creative.bg} border-2 ${cardCharacters.creative.border} ${cardCharacters.creative.text} flex items-center justify-center gap-2`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: 'inset 0 0 30px rgba(161, 136, 127, 0.2)' }}
                  ></div>
                  <UserPlus className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Create Group</span>
                </button>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setSelectedMembers([]);
                    setGroupLead('');
                    setGroupSearchQuery('');
                  }}
                  className={`relative px-6 py-3 rounded-lg font-bold text-sm border-2 ${colors.inputBorder} ${colors.inputBg} ${colors.textPrimary} group`}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
                  ></div>
                  <span className="relative z-10">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}