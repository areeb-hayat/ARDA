// ============================================
// app/components/ticketing/TicketActionsList.tsx
// UPDATED: Allow group formation for in-progress tickets, use theme toast
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2, ArrowRight, AlertTriangle, 
  Users, UserPlus, Play, Send, CheckCircle2
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Employee {
  _id: string;
  name: string;
  department: string;
}

interface WorkflowPosition {
  isFirst: boolean;
  isLast: boolean;
  canForward: boolean;
  canRevert: boolean;
  nextNodeType: string | null;
  prevNodeType: string | null;
}

interface Props {
  ticket: any;
  userId: string;
  userName: string;
  workflowPosition: WorkflowPosition;
  canTakeActions: boolean;
  isGroupLead: boolean;
  isGroupMember: boolean;
  onActionPerform: (action: string, payload: any) => Promise<void>;
  loading: boolean;
}

export default function TicketActionsList({ 
  ticket, 
  userId, 
  userName,
  workflowPosition, 
  canTakeActions,
  isGroupLead,
  isGroupMember,
  onActionPerform,
  loading 
}: Props) {
  const { colors, cardCharacters, showToast } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [blockerDescription, setBlockerDescription] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const getNextNode = () => {
    if (!ticket.functionality?.workflow || !workflowPosition.canForward) {
      return null;
    }
    
    const workflow = ticket.functionality.workflow;
    const nextEdge = workflow.edges.find((e: any) => e.source === ticket.workflowStage);
    
    if (!nextEdge) return null;
    
    return workflow.nodes.find((n: any) => n.id === nextEdge.target);
  };

  const fetchDepartmentEmployees = async () => {
    try {
      setLoadingEmployees(true);
      
      const department = ticket.functionality?.department || ticket.department || 'IT';
      const response = await fetch(`/api/dept-employees?department=${encodeURIComponent(department)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      
      const availableEmployees = (data.employees || [])
        .filter((emp: any) => emp._id !== userId)
        .map((emp: any) => ({
          _id: emp._id,
          name: emp.basicDetails?.name || emp.username || 'Unknown',
          department: emp.department || department
        }));
      
      setEmployees(availableEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToast('Failed to load employees. Please try again.', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleActionClick = (action: string) => {
    setSelectedAction(action);
    if (['reassign', 'form_group'].includes(action)) {
      fetchDepartmentEmployees();
    }
  };

  const handleSubmit = async () => {
    if (!selectedAction) return;

    if (selectedAction === 'report_blocker' && !blockerDescription) {
      showToast('Please describe the blocker', 'warning');
      return;
    }

    if (['reassign', 'form_group'].includes(selectedAction) && selectedEmployees.length === 0) {
      showToast('Please select at least one employee', 'warning');
      return;
    }

    const payload: any = {
      action: selectedAction,
      performedBy: {
        userId: userId,
        name: userName
      }
    };

    if (selectedAction === 'forward') {
      const nextNode = getNextNode();
      if (!nextNode) {
        showToast('Cannot determine next node in workflow', 'error');
        return;
      }
      payload.toNode = nextNode.id;
      if (explanation) payload.explanation = explanation;
    }

    if (explanation && selectedAction !== 'forward') {
      payload.explanation = explanation;
    }

    if (blockerDescription) {
      payload.blockerDescription = blockerDescription;
    }
    
    if (selectedAction === 'reassign') {
      payload.reassignTo = selectedEmployees;
      if (explanation) payload.explanation = explanation;
    }

    if (selectedAction === 'form_group') {
      const groupMembers = [userId, ...selectedEmployees].map(empId => {
        if (empId === userId) {
          return { userId, name: userName };
        }
        const emp = employees.find(e => e._id === empId);
        return {
          userId: empId,
          name: emp?.name || 'Unknown'
        };
      });
      payload.groupMembers = groupMembers;
      payload.groupLead = userId;
    }

    await onActionPerform(selectedAction, payload);
    
    setSelectedAction(null);
    setExplanation('');
    setBlockerDescription('');
    setSelectedEmployees([]);
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const getAvailableActions = () => {
    if (!canTakeActions) return [];

    const actions: string[] = [];

    if (ticket.status === 'pending') {
      actions.push('mark_in_progress');
      actions.push('reassign');
      
      if (!isGroupMember) {
        actions.push('form_group');
      }
    }

    if (ticket.status === 'in-progress') {
      if (workflowPosition.canForward) {
        actions.push('forward');
      }
      
      if (!isGroupMember || isGroupLead) {
        actions.push('reassign');
      }
      
      // 🆕 Allow group formation for in-progress tickets (if not already in a group)
      if (!isGroupMember) {
        actions.push('form_group');
      }
      
      actions.push('report_blocker');
    }

    if (ticket.status === 'blocked') {
      actions.push('blocker_resolved');
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  if (!canTakeActions) {
    return (
      <div className={`relative overflow-hidden p-6 rounded-xl border-2 text-center ${colors.inputBg} ${colors.inputBorder}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        <div className="relative">
          <Users className={`w-12 h-12 ${colors.textMuted} mx-auto mb-3`} />
          <p className={`${colors.textPrimary} font-semibold mb-2`}>
            You're a Group Member
          </p>
          <p className={`text-sm ${colors.textSecondary}`}>
            Only the group lead can perform workflow actions. View details in the Details tab.
          </p>
        </div>
      </div>
    );
  }

  if (selectedAction) {
    return (
      <div className="space-y-4">
        <div 
          className={`relative overflow-hidden p-4 rounded-xl border-2 bg-gradient-to-br ${charColors.bg} ${charColors.border}`}
        >
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <p className={`relative font-semibold ${charColors.text}`}>
            {selectedAction.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </p>
        </div>

        {/* Explanation Field */}
        {['forward', 'reassign'].includes(selectedAction) && (
          <div>
            <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
              Explanation (Optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide details about this action..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl text-sm transition-all resize-none ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
            />
          </div>
        )}

        {/* Blocker Description */}
        {selectedAction === 'report_blocker' && (
          <div>
            <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
              Blocker Description (Required) *
            </label>
            <textarea
              value={blockerDescription}
              onChange={(e) => setBlockerDescription(e.target.value)}
              placeholder="Describe what's blocking progress..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl text-sm transition-all resize-none ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
              required
            />
          </div>
        )}

        {/* Employee Selection */}
        {['reassign', 'form_group'].includes(selectedAction) && (
          <div>
            <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
              Select Employees *
            </label>
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className={`w-6 h-6 animate-spin ${charColors.iconColor}`} />
              </div>
            ) : employees.length === 0 ? (
              <div className={`relative overflow-hidden p-4 rounded-lg border-2 text-center ${colors.inputBg} ${colors.inputBorder}`}>
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                <p className={`relative text-sm ${colors.textSecondary}`}>
                  No other employees available in this department
                </p>
              </div>
            ) : (
              <div 
                className={`max-h-64 overflow-y-auto rounded-xl border-2 p-3 space-y-2 ${colors.inputBg} ${colors.inputBorder}`}
              >
                {employees.map(employee => (
                  <label
                    key={employee._id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border-2 ${
                      selectedEmployees.includes(employee._id)
                        ? `bg-gradient-to-br ${charColors.bg} ${charColors.border} scale-[1.02]`
                        : `${colors.inputBg} ${colors.borderSubtle} hover:border-opacity-60`
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee._id)}
                      onChange={() => toggleEmployeeSelection(employee._id)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: charColors.iconColor.replace('text-', '') }}
                    />
                    <div className="flex-1">
                      <span className={`${colors.textPrimary} font-medium block`}>
                        {employee.name}
                      </span>
                      <p className={`text-xs ${colors.textMuted}`}>
                        {employee.department}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {selectedAction === 'form_group' && (
              <p className={`text-xs mt-2 ${colors.textMuted}`}>
                💡 You will be automatically added as the group lead
              </p>
            )}
            {selectedAction === 'reassign' && (
              <p className={`text-xs mt-2 ${cardCharacters.interactive.text}`}>
                ⚠️ Reassigning will remove you from this ticket
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => {
              setSelectedAction(null);
              setExplanation('');
              setBlockerDescription('');
              setSelectedEmployees([]);
            }}
            className={`group relative flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${colors.inputBg} ${colors.inputBorder} ${colors.textPrimary}`}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
            ></div>
            <span className="relative z-10">Back</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`group relative flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} overflow-hidden`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
            ></div>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                <span className="relative z-10">Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Confirm Action</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (availableActions.length === 0) {
    return (
      <div className={`relative overflow-hidden p-6 rounded-xl border-2 text-center ${colors.inputBg} ${colors.inputBorder}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        <div className="relative">
          <AlertTriangle className={`w-12 h-12 ${colors.textMuted} mx-auto mb-3`} />
          <p className={`${colors.textPrimary} font-semibold mb-2`}>
            No Actions Available
          </p>
          <p className={`text-sm ${colors.textSecondary}`}>
            {ticket.status === 'blocked'
              ? 'This ticket is blocked. Wait for the blocker to be resolved.'
              : ticket.status === 'resolved'
              ? 'This ticket has been resolved. Only the creator can close or reopen it.'
              : ticket.status === 'closed'
              ? 'This ticket is closed. Only the creator can reopen it.'
              : 'No actions available at this workflow stage'}
          </p>
        </div>
      </div>
    );
  }

  const nextNode = getNextNode();

  return (
    <div className="grid grid-cols-2 gap-3">
      {availableActions.includes('mark_in_progress') && (
        <ActionButton
          icon={<Play className="w-5 h-5" />}
          label="Mark In Progress"
          description="Start working on ticket"
          character={cardCharacters.completed}
          onClick={() => handleActionClick('mark_in_progress')}
        />
      )}

      {availableActions.includes('forward') && nextNode && (
        <ActionButton
          icon={<ArrowRight className="w-5 h-5" />}
          label={nextNode.type === 'end' ? 'Complete' : `Forward to ${nextNode.data?.label || 'Next'}`}
          description={nextNode.type === 'end' ? 'Mark as resolved' : 'Move to next stage'}
          character={cardCharacters.informative}
          onClick={() => handleActionClick('forward')}
        />
      )}

      {availableActions.includes('report_blocker') && (
        <ActionButton
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Report Blocker"
          description="Flag an issue"
          character={cardCharacters.interactive}
          onClick={() => handleActionClick('report_blocker')}
        />
      )}

      {availableActions.includes('reassign') && (
        <ActionButton
          icon={<UserPlus className="w-5 h-5" />}
          label="Reassign"
          description="Assign to another"
          character={cardCharacters.authoritative}
          onClick={() => handleActionClick('reassign')}
        />
      )}

      {availableActions.includes('form_group') && (
        <ActionButton
          icon={<Users className="w-5 h-5" />}
          label="Form Group"
          description="Create team"
          character={cardCharacters.creative}
          onClick={() => handleActionClick('form_group')}
        />
      )}

      {availableActions.includes('blocker_resolved') && (
        <ActionButton
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Resolve Blocker"
          description="Mark blocker resolved"
          character={cardCharacters.completed}
          onClick={() => handleActionClick('blocker_resolved')}
        />
      )}
    </div>
  );
}

// Action Button Component
function ActionButton({ icon, label, description, character, onClick }: any) {
  const { colors } = useTheme();
  
  return (
    <button
      onClick={onClick}
      className={`group relative p-4 rounded-xl border-2 transition-all hover:scale-105 text-left overflow-hidden bg-gradient-to-br ${character.bg} ${character.border}`}
    >
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
      ></div>
      
      <div className="relative">
        <div 
          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110 bg-gradient-to-r ${character.bg} ${character.iconColor}`}
        >
          {icon}
        </div>
        <p className={`font-bold ${character.text} mb-1`}>{label}</p>
        <p className={`text-xs ${colors.textMuted}`}>
          {description}
        </p>
      </div>
    </button>
  );
}