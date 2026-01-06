// app/components/SprintManagement/depthead/SprintDetailsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  X,
  Zap,
  Users,
  MessageSquare,
  Plus,
  CheckCircle,
  Archive,
  RotateCcw,
  Send,
  Loader2,
  UserPlus,
  UserMinus,
  Crown
} from 'lucide-react';
import ActionCard from './ActionCard';
import CreateActionModal from './CreateActionModal';

interface Employee {
  _id: string;
  username: string;
  'basicDetails.name': string;
  title: string;
}

interface SprintDetailsModalProps {
  sprint: any;
  userId: string;
  userName: string;
  department: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function SprintDetailsModal({
  sprint,
  userId,
  userName,
  department,
  onClose,
  onUpdate
}: SprintDetailsModalProps) {
  const { colors, cardCharacters, showToast, getModalStyles } = useTheme();
  const charColors = cardCharacters.interactive;

  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'members' | 'chat'>('overview');
  const [showCreateAction, setShowCreateAction] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [chatMessage, setChatMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Zap },
    { id: 'actions', label: 'Actions', icon: Zap },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare }
  ];

  useEffect(() => {
    if (showAddMember && employees.length === 0) {
      fetchEmployees();
    }
  }, [showAddMember]);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const response = await fetch(`/api/dept-employees?department=${encodeURIComponent(department)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employees');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.employees)) {
        // Filter out employees who are already members
        const activeMemberIds = sprint.members
          ?.filter((m: any) => !m.leftAt)
          .map((m: any) => m.userId) || [];
        
        const availableEmployees = data.employees.filter(
          (emp: Employee) => !activeMemberIds.includes(emp._id)
        );
        
        setEmployees(availableEmployees);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToast('Failed to fetch employees', 'error');
      setEmployees([]);
    } finally {
      setFetchingEmployees(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    if (!employeeSearch) return true;
    const searchLower = employeeSearch.toLowerCase();
    const name = (emp['basicDetails.name'] || emp.username || '').toLowerCase();
    const title = (emp.title || '').toLowerCase();
    return name.includes(searchLower) || title.includes(searchLower);
  });

  const handleStatusAction = async (action: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/SprintManagement/depthead/sprints/${sprint._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, userName })
      });

      if (!response.ok) throw new Error('Failed to update sprint');
      
      showToast(`Sprint ${action}d successfully`, 'success');
      onUpdate();
    } catch (error) {
      showToast(`Failed to ${action} sprint`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const employee = employees.find(e => e._id === selectedEmployee);
    if (!employee) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/SprintManagement/depthead/sprints/${sprint._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-member',
          userId,
          userName,
          member: {
            userId: employee._id,
            name: employee['basicDetails.name'] || employee.username,
            role: 'member'
          }
        })
      });

      if (!response.ok) throw new Error('Failed to add member');
      
      showToast('Member added successfully', 'success');
      setSelectedEmployee('');
      setEmployeeSearch('');
      setShowAddMember(false);
      setEmployees([]); // Reset to refetch on next open
      onUpdate();
    } catch (error) {
      showToast('Failed to add member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {

    try {
      setLoading(true);
      const response = await fetch(`/api/SprintManagement/depthead/sprints/${sprint._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove-member',
          userId,
          userName,
          memberId
        })
      });

      if (!response.ok) throw new Error('Failed to remove member');
      
      showToast('Member removed successfully', 'success');
      onUpdate();
    } catch (error) {
      showToast('Failed to remove member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/SprintManagement/depthead/sprints/${sprint._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-chat-message',
          userId,
          userName,
          message: chatMessage
        })
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      setChatMessage('');
      onUpdate();
    } catch (error) {
      showToast('Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const activeMembers = sprint.members?.filter((m: any) => !m.leftAt) || [];
  const pendingActions = sprint.actions?.filter((d: any) => d.status !== 'done') || [];

  return (
    <>
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
            w-full max-w-6xl
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg}`}>
                  <Zap className={`h-5 w-5 ${charColors.iconColor}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-black ${colors.modalHeaderText}`}>
                    {sprint.sprintNumber}
                  </h2>
                  <p className={`text-sm ${colors.textMuted}`}>{sprint.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors duration-300 ${colors.buttonGhost} ${colors.buttonGhostText}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`
                        : `${colors.textMuted} hover:${colors.textPrimary}`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Content */}
          <div className={`relative p-6 ${colors.modalContentBg} max-h-[calc(90vh-200px)] overflow-y-auto`}>
            <div className={colors.modalContentText}>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className={`p-4 rounded-lg ${colors.cardBg} border ${colors.border}`}>
                    <h3 className={`text-sm font-bold ${colors.textPrimary} mb-2`}>Description</h3>
                    <p className={`text-sm ${colors.textSecondary}`}>{sprint.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg ${colors.cardBg} border ${colors.border}`}>
                      <div className={`text-xs font-bold ${colors.textMuted} mb-1`}>STATUS</div>
                      <div className={`text-lg font-black ${colors.textPrimary}`}>
                        {sprint.status.toUpperCase()}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${colors.cardBg} border ${colors.border}`}>
                      <div className={`text-xs font-bold ${colors.textMuted} mb-1`}>HEALTH</div>
                      <div className={`text-lg font-black ${colors.textPrimary}`}>
                        {sprint.health.toUpperCase().replace('-', ' ')}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${colors.cardBg} border ${colors.border}`}>
                      <div className={`text-xs font-bold ${colors.textMuted} mb-1`}>ACTIONS</div>
                      <div className={`text-lg font-black ${colors.textPrimary}`}>
                        {pendingActions.length} Pending
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {sprint.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleStatusAction('complete')}
                          disabled={loading}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors duration-300 flex items-center gap-2 bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text} disabled:opacity-50`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Complete Sprint
                        </button>
                        <button
                          onClick={() => handleStatusAction('archive')}
                          disabled={loading}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors duration-300 flex items-center gap-2 border-2 ${cardCharacters.neutral.border} ${cardCharacters.neutral.text} disabled:opacity-50`}
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                      </>
                    )}
                    {(sprint.status === 'completed' || sprint.status === 'archived') && (
                      <button
                        onClick={() => handleStatusAction('reopen')}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors duration-300 flex items-center gap-2 bg-gradient-to-r ${cardCharacters.interactive.bg} ${cardCharacters.interactive.text} disabled:opacity-50`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reopen Sprint
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-lg font-black ${colors.textPrimary}`}>
                      Actions ({sprint.actions?.length || 0})
                    </h3>
                    <button
                      onClick={() => setShowCreateAction(true)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors duration-300 flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
                    >
                      <Plus className="w-4 h-4" />
                      Add Action
                    </button>
                  </div>

                  {sprint.actions?.length === 0 ? (
                    <div className={`p-12 text-center rounded-lg ${colors.cardBg} border ${colors.border}`}>
                      <Zap className={`w-12 h-12 mx-auto mb-3 ${colors.textMuted} opacity-40`} />
                      <p className={`${colors.textPrimary} font-bold mb-2`}>No actions yet</p>
                      <p className={`${colors.textSecondary} text-sm`}>
                        Create your first action to get started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sprint.actions.map((action: any) => (
                        <ActionCard
                          key={action._id}
                          action={action}
                          sprintId={sprint._id}
                          userId={userId}
                          userName={userName}
                          onUpdate={onUpdate}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-lg font-black ${colors.textPrimary}`}>
                      Team Members ({activeMembers.length})
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddMember(!showAddMember);
                        if (!showAddMember && employees.length === 0) {
                          fetchEmployees();
                        }
                      }}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors duration-300 flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Member
                    </button>
                  </div>

                  {/* Add Member Section */}
                  {showAddMember && (
                    <div className={`p-4 rounded-lg ${colors.cardBg} border ${colors.border} space-y-3`}>
                      <h4 className={`text-sm font-bold ${colors.textPrimary}`}>Select Employee to Add</h4>
                      
                      {fetchingEmployees ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className={`w-6 h-6 animate-spin ${colors.textMuted}`} />
                        </div>
                      ) : employees.length === 0 ? (
                        <div className={`p-4 text-center`}>
                          <p className={`text-sm ${colors.textMuted}`}>No available employees to add</p>
                        </div>
                      ) : (
                        <>
                          {/* Search Input */}
                          <input
                            type="text"
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            placeholder="Search employees by name or title..."
                            className={`w-full px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
                          />
                          
                          {/* Employee List */}
                          <div className={`rounded-lg border ${colors.border} max-h-64 overflow-y-auto`}>
                            {filteredEmployees.length === 0 ? (
                              <div className="p-4 text-center">
                                <p className={`text-sm ${colors.textMuted}`}>No employees match your search</p>
                              </div>
                            ) : (
                              filteredEmployees.map((employee) => (
                                <div
                                  key={employee._id}
                                  className={`flex items-center justify-between p-3 border-b last:border-b-0 ${colors.borderSubtle} ${
                                    selectedEmployee === employee._id
                                      ? `bg-gradient-to-r ${cardCharacters.informative.bg}`
                                      : `${colors.cardBg} hover:${colors.cardBgHover}`
                                  } transition-all cursor-pointer`}
                                  onClick={() => setSelectedEmployee(employee._id)}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                        selectedEmployee === employee._id
                                          ? `${cardCharacters.informative.border} ${cardCharacters.informative.bg}`
                                          : colors.border
                                      }`}
                                    >
                                      {selectedEmployee === employee._id && (
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
                                </div>
                              ))
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddMember}
                              disabled={!selectedEmployee || loading}
                              className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-colors bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50`}
                            >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Member'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddMember(false);
                                setSelectedEmployee('');
                                setEmployeeSearch('');
                              }}
                              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${colors.buttonGhost} ${colors.buttonGhostText}`}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Members List */}
                  <div className="space-y-2">
                    {activeMembers.map((member: any) => (
                      <div
                        key={member.userId}
                        className={`flex items-center justify-between p-4 rounded-lg ${colors.cardBg} border ${colors.border}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-bold ${colors.textPrimary}`}>{member.name}</p>
                            {member.role === 'lead' && (
                              <Crown className={`w-4 h-4 ${cardCharacters.completed.iconColor}`} />
                            )}
                          </div>
                          <p className={`text-sm ${colors.textMuted}`}>
                            {member.role === 'lead' ? 'Group Lead' : 'Member'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs ${colors.textMuted}`}>
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </span>
                          {member.role !== 'lead' && (
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={loading}
                              className={`p-2 rounded-lg transition-colors ${colors.buttonGhost} ${colors.buttonGhostText} disabled:opacity-50`}
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <h3 className={`text-lg font-black ${colors.textPrimary}`}>
                    Sprint Chat
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sprint.chat?.length === 0 ? (
                      <div className={`p-8 text-center rounded-lg ${colors.cardBg} border ${colors.border}`}>
                        <MessageSquare className={`w-10 h-10 mx-auto mb-2 ${colors.textMuted} opacity-40`} />
                        <p className={`${colors.textMuted} text-sm`}>No messages yet</p>
                      </div>
                    ) : (
                      sprint.chat?.map((msg: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg ${colors.cardBg}`}>
                          <div className="flex justify-between mb-1">
                            <span className={`text-sm font-bold ${colors.textPrimary}`}>
                              {msg.userName}
                            </span>
                            <span className={`text-xs ${colors.textMuted}`}>
                              {new Date(msg.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className={`text-sm ${colors.textSecondary}`}>{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a message..."
                      className={`flex-1 px-4 py-3 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
                    />
                    <button
                      type="submit"
                      disabled={!chatMessage.trim() || loading}
                      className={`p-3 rounded-lg bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50`}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreateAction && (
        <CreateActionModal
          sprint={sprint}
          userId={userId}
          userName={userName}
          onClose={() => setShowCreateAction(false)}
          onSuccess={() => {
            setShowCreateAction(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}