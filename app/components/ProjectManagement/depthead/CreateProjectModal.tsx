// app/components/ProjectManagement/depthead/CreateProjectModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { X, FolderKanban, Loader2, CheckCircle } from 'lucide-react';

interface Employee {
  _id: string;
  username: string;
  'basicDetails.name': string;
  title: string;
}

interface CreateProjectModalProps {
  department: string;
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({
  department,
  userId,
  userName,
  onClose,
  onSuccess
}: CreateProjectModalProps) {
  const { colors, cardCharacters, showToast, getModalStyles } = useTheme();
  const charColors = cardCharacters.authoritative;

  // Debug log to check props
  useEffect(() => {
    console.log('CreateProjectModal props:', { department, userId, userName });
    
    if (!department) {
      console.error('Department is undefined in CreateProjectModal!');
      showToast('Error: Department not provided', 'error');
    }
  }, [department, userId, userName]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupLead, setGroupLead] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);

  useEffect(() => {
    if (department) {
      fetchEmployees();
    }
  }, [department]);

  const filteredEmployees = employees.filter(emp => {
    if (!employeeSearch) return true;
    const searchLower = employeeSearch.toLowerCase();
    const name = (emp['basicDetails.name'] || emp.username || '').toLowerCase();
    const title = (emp.title || '').toLowerCase();
    return name.includes(searchLower) || title.includes(searchLower);
  });

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const response = await fetch(`/api/dept-employees?department=${encodeURIComponent(department)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employees');
      }

      const data = await response.json();
      console.log('Fetched employees:', data); // Debug log
      
      if (data.success && Array.isArray(data.employees)) {
        setEmployees(data.employees);
      } else {
        setEmployees([]);
        console.warn('Unexpected data format:', data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToast('Failed to fetch employees', 'error');
      setEmployees([]);
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleMemberToggle = (employeeId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(employeeId)) {
        const newMembers = prev.filter(id => id !== employeeId);
        if (groupLead === employeeId) {
          setGroupLead(newMembers[0] || '');
        }
        return newMembers;
      } else {
        const newMembers = [...prev, employeeId];
        if (!groupLead) {
          setGroupLead(employeeId);
        }
        return newMembers;
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !startDate || selectedMembers.length === 0 || !groupLead) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    try {
      setLoading(true);

      const members = selectedMembers.map(id => {
        const employee = employees.find(e => e._id === id);
        return {
          userId: id,
          name: employee?.['basicDetails.name'] || employee?.username || 'Unknown',
          role: id === groupLead ? 'lead' : 'member'
        };
      });

      const response = await fetch('/api/ProjectManagement/depthead/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          department,
          createdBy: userId,
          createdByName: userName,
          members,
          groupLead,
          startDate,
          targetEndDate: targetEndDate || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      showToast('Project created successfully!', 'success');
      onSuccess();
    } catch (error) {
      showToast('Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={getModalStyles()}>
      {/* Backdrop click to close */}
      <div 
        className="absolute inset-0 modal-backdrop" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div 
        className={`
          relative rounded-2xl border ${colors.modalBorder}
          ${colors.modalBg} ${colors.modalShadow}
          w-full max-w-2xl
          modal-content
        `}
        style={{ overflow: 'hidden' }}
      >
        {/* Paper Texture Overlay */}
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03] pointer-events-none`}></div>

        {/* Modal Header */}
        <div className={`
          relative px-6 py-4 border-b ${colors.modalFooterBorder}
          ${colors.modalHeaderBg}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg}`}>
                <FolderKanban className={`h-5 w-5 ${charColors.iconColor}`} />
              </div>
              <div>
                <h2 className={`text-xl font-black ${colors.modalHeaderText}`}>
                  Create New Project
                </h2>
                <p className={`text-xs ${colors.textMuted}`}>
                  Set up a new project with team members
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`group relative p-2 rounded-lg transition-all duration-300 ${colors.buttonGhost} ${colors.buttonGhostText}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className={`relative p-6 ${colors.modalContentBg} max-h-[calc(90vh-180px)] overflow-y-auto`}>
          <form onSubmit={handleSubmit} className={`space-y-6 ${colors.modalContentText}`}>
            {/* Title */}
            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title"
                className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the project objectives and goals"
                rows={4}
                className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} resize-none`}
                required
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                  Target End Date (Optional)
                </label>
                <input
                  type="date"
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                  min={startDate}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
                />
              </div>
            </div>

            {/* Team Members */}
            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Team Members * (Select at least one)
              </label>
              
              {fetchingEmployees ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className={`w-6 h-6 animate-spin ${colors.textMuted}`} />
                </div>
              ) : employees.length === 0 ? (
                <div className={`p-4 rounded-lg border ${colors.border} ${colors.cardBg} text-center`}>
                  <p className={`text-sm ${colors.textMuted}`}>No employees found in this department</p>
                </div>
              ) : (
                <div className={`rounded-lg border ${colors.border} overflow-hidden`}>
                  {/* Search Input */}
                  <div className={`p-3 border-b ${colors.border}`}>
                    <input
                      type="text"
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      placeholder="Search employees by name or title..."
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
                    />
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className={`text-sm ${colors.textMuted}`}>No employees match your search</p>
                      </div>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <div
                          key={employee._id}
                          className={`flex items-center justify-between p-3 border-b last:border-b-0 ${colors.borderSubtle} ${
                            selectedMembers.includes(employee._id)
                              ? `bg-gradient-to-r ${cardCharacters.informative.bg}`
                              : `${colors.cardBg} hover:${colors.cardBgHover}`
                          } transition-all cursor-pointer`}
                          onClick={() => handleMemberToggle(employee._id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                selectedMembers.includes(employee._id)
                                  ? `${cardCharacters.informative.border} ${cardCharacters.informative.bg}`
                                  : colors.border
                              }`}
                            >
                              {selectedMembers.includes(employee._id) && (
                                <CheckCircle className={`w-3.5 h-3.5 ${cardCharacters.informative.iconColor}`} />
                              )}
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${colors.textPrimary}`}>
                                {employee['basicDetails.name'] || employee.username}
                              </p>
                              <p className={`text-xs ${colors.textMuted}`}>{employee.title || 'Employee'}</p>
                            </div>
                          </div>
                          
                          {selectedMembers.includes(employee._id) && (
                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="radio"
                                name="groupLead"
                                checked={groupLead === employee._id}
                                onChange={() => setGroupLead(employee._id)}
                                className="cursor-pointer w-4 h-4"
                              />
                              <span className={`text-xs font-bold ${colors.textMuted}`}>Lead</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {selectedMembers.length > 0 && (
                <p className={`mt-2 text-xs ${colors.textMuted}`}>
                  Selected: {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
                  {groupLead && ` • Lead: ${employees.find(e => e._id === groupLead)?.['basicDetails.name'] || 'Unknown'}`}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className={`
          relative px-6 py-4 border-t ${colors.modalFooterBorder}
          ${colors.modalFooterBg} flex justify-end gap-3
        `}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`group relative px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${colors.buttonSecondary} ${colors.buttonSecondaryText} disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedMembers.length === 0 || !groupLead}
            className={`group relative px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50 flex items-center space-x-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <FolderKanban className="w-4 h-4" />
                <span>Create Project</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}