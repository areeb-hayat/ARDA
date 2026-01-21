// ============================================
// app/components/ticketing/TicketActionsList.tsx
// UPDATED: Forward attachments, required explanation, theme-compliant buttons (NO SCALE)
// ============================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, ArrowRight, AlertTriangle, 
  Users, UserPlus, Play, Send, CheckCircle2,
  Undo2, Paperclip, X
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

interface FileWithPreview {
  file: File;
  name: string;
  preview?: string;
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
  const [revertMessage, setRevertMessage] = useState('');
  const [revertFiles, setRevertFiles] = useState<FileWithPreview[]>([]);
  const [forwardMessage, setForwardMessage] = useState('');
  const [forwardFiles, setForwardFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const forwardFileInputRef = useRef<HTMLInputElement>(null);
  
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

  const getPrevNode = () => {
    if (!ticket.functionality?.workflow || !workflowPosition.canRevert) {
      return null;
    }
    
    const workflow = ticket.functionality.workflow;
    const prevEdge = workflow.edges.find((e: any) => e.target === ticket.workflowStage);
    
    if (!prevEdge) return null;
    
    return workflow.nodes.find((n: any) => n.id === prevEdge.source);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'revert' | 'forward') => {
    const files = Array.from(e.target.files || []);
    
    const newFiles: FileWithPreview[] = files.map(file => {
      const fileWithPreview: FileWithPreview = {
        file,
        name: file.name
      };
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          fileWithPreview.preview = reader.result as string;
          if (type === 'revert') {
            setRevertFiles(prev => [...prev]);
          } else {
            setForwardFiles(prev => [...prev]);
          }
        };
        reader.readAsDataURL(file);
      }
      
      return fileWithPreview;
    });
    
    if (type === 'revert') {
      setRevertFiles(prev => [...prev, ...newFiles]);
    } else {
      setForwardFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number, type: 'revert' | 'forward') => {
    if (type === 'revert') {
      setRevertFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setForwardFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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

    if (selectedAction === 'revert' && !revertMessage) {
      showToast('Please provide a revert message', 'warning');
      return;
    }

    if (selectedAction === 'forward' && !forwardMessage) {
      showToast('Please provide a forward message', 'warning');
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
      payload.explanation = forwardMessage; // REQUIRED
      
      // Process forward attachments (OPTIONAL)
      if (forwardFiles.length > 0) {
        try {
          const attachments = await Promise.all(
            forwardFiles.map(async ({ file }) => ({
              name: file.name,
              type: file.type,
              data: await fileToBase64(file)
            }))
          );
          payload.forwardAttachments = attachments;
        } catch (error) {
          console.error('Error processing forward files:', error);
          showToast('Failed to process file attachments', 'error');
          return;
        }
      }
    }

    if (selectedAction === 'revert') {
      const prevNode = getPrevNode();
      if (!prevNode) {
        showToast('Cannot determine previous node in workflow', 'error');
        return;
      }
      payload.toNode = prevNode.id;
      payload.revertMessage = revertMessage;
      
      // Process revert attachments (OPTIONAL)
      if (revertFiles.length > 0) {
        try {
          const attachments = await Promise.all(
            revertFiles.map(async ({ file }) => ({
              name: file.name,
              type: file.type,
              data: await fileToBase64(file)
            }))
          );
          payload.revertAttachments = attachments;
        } catch (error) {
          console.error('Error processing revert files:', error);
          showToast('Failed to process file attachments', 'error');
          return;
        }
      }
    }

    if (explanation && !['forward', 'revert'].includes(selectedAction)) {
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
    setRevertMessage('');
    setRevertFiles([]);
    setForwardMessage('');
    setForwardFiles([]);
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
      
      // Can revert from pending if not at first node
      if (workflowPosition.canRevert && !workflowPosition.isFirst) {
        actions.push('revert');
      }
    }

    if (ticket.status === 'in-progress') {
      if (workflowPosition.canForward) {
        actions.push('forward');
      }
      
      if (!isGroupMember || isGroupLead) {
        actions.push('reassign');
      }
      
      if (!isGroupMember) {
        actions.push('form_group');
      }
      
      actions.push('report_blocker');
      
      // Can revert from in-progress if not at first node
      if (workflowPosition.canRevert && !workflowPosition.isFirst) {
        actions.push('revert');
      }
    }

    if (ticket.status === 'blocked') {
      actions.push('blocker_resolved');
      
      // Can revert from blocked if not at first node
      if (workflowPosition.canRevert && !workflowPosition.isFirst) {
        actions.push('revert');
      }
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
    const prevNode = selectedAction === 'revert' ? getPrevNode() : null;
    const nextNode = selectedAction === 'forward' ? getNextNode() : null;
    
    return (
      <div className="space-y-4">
        <div 
          className={`relative overflow-hidden p-4 rounded-xl border-2 bg-gradient-to-br ${charColors.bg} ${charColors.border}`}
        >
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <p className={`relative font-semibold ${charColors.text}`}>
            {selectedAction === 'revert' && prevNode
              ? `Revert to: ${prevNode.data?.label || 'Previous Stage'}`
              : selectedAction === 'forward' && nextNode
              ? `Forward to: ${nextNode.data?.label || 'Next Stage'}`
              : selectedAction.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </p>
        </div>

        {/* Forward Message & Files */}
        {selectedAction === 'forward' && (
          <>
            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Forward Message (Required) *
              </label>
              <textarea
                value={forwardMessage}
                onChange={(e) => setForwardMessage(e.target.value)}
                placeholder="Explain what you've done and any notes for the next stage..."
                rows={4}
                className={`w-full px-4 py-3 rounded-xl text-sm transition-all resize-none ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} ${colors.inputFocusBg}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Attachments (Optional)
              </label>
              
              <input
                ref={forwardFileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e, 'forward')}
                className="hidden"
                accept="*/*"
              />
              
              <button
                type="button"
                onClick={() => forwardFileInputRef.current?.click()}
                className={`group relative w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden ${colors.inputBg} ${colors.inputBorder} ${colors.textPrimary} flex items-center justify-center gap-2`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
                ></div>
                <Paperclip className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-all duration-300" />
                <span className="relative z-10">Click to attach files</span>
              </button>
              
              {forwardFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {forwardFiles.map((fileObj, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${colors.inputBg} ${colors.inputBorder}`}
                    >
                      {fileObj.preview ? (
                        <img
                          src={fileObj.preview}
                          alt={fileObj.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <Paperclip className={`w-5 h-5 ${colors.textMuted}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${colors.textPrimary} truncate`}>
                          {fileObj.name}
                        </p>
                        <p className={`text-xs ${colors.textMuted}`}>
                          {(fileObj.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index, 'forward')}
                        className={`group relative p-1 rounded-lg transition-all duration-300 overflow-hidden ${colors.buttonGhost} ${colors.buttonGhostText}`}
                      >
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{ boxShadow: `inset 0 0 10px ${colors.glowWarning}` }}
                        ></div>
                        <X className="w-4 h-4 relative z-10 group-hover:rotate-90 transition-all duration-300" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Revert Message & Files */}
        {selectedAction === 'revert' && (
          <>
            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Revert Message (Required) *
              </label>
              <textarea
                value={revertMessage}
                onChange={(e) => setRevertMessage(e.target.value)}
                placeholder="Explain why you're reverting this ticket..."
                rows={4}
                className={`w-full px-4 py-3 rounded-xl text-sm transition-all resize-none ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} ${colors.inputFocusBg}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Attachments (Optional)
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e, 'revert')}
                className="hidden"
                accept="*/*"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`group relative w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden ${colors.inputBg} ${colors.inputBorder} ${colors.textPrimary} flex items-center justify-center gap-2`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
                ></div>
                <Paperclip className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-all duration-300" />
                <span className="relative z-10">Click to attach files</span>
              </button>
              
              {revertFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {revertFiles.map((fileObj, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${colors.inputBg} ${colors.inputBorder}`}
                    >
                      {fileObj.preview ? (
                        <img
                          src={fileObj.preview}
                          alt={fileObj.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <Paperclip className={`w-5 h-5 ${colors.textMuted}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${colors.textPrimary} truncate`}>
                          {fileObj.name}
                        </p>
                        <p className={`text-xs ${colors.textMuted}`}>
                          {(fileObj.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index, 'revert')}
                        className={`group relative p-1 rounded-lg transition-all duration-300 overflow-hidden ${colors.buttonGhost} ${colors.buttonGhostText}`}
                      >
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{ boxShadow: `inset 0 0 10px ${colors.glowWarning}` }}
                        ></div>
                        <X className="w-4 h-4 relative z-10 group-hover:rotate-90 transition-all duration-300" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Explanation Field (for reassign) */}
        {['reassign'].includes(selectedAction) && (
          <div>
            <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
              Explanation (Optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide details about this action..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl text-sm transition-all resize-none ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} ${colors.inputFocusBg}`}
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
              className={`w-full px-4 py-3 rounded-xl text-sm transition-all resize-none ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} ${colors.inputFocusBg}`}
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
                        ? `bg-gradient-to-br ${charColors.bg} ${charColors.border}`
                        : `${colors.inputBg} ${colors.borderSubtle}`
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

        {/* Action Buttons - THEME COMPLIANT (NO SCALE) */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => {
              setSelectedAction(null);
              setExplanation('');
              setBlockerDescription('');
              setRevertMessage('');
              setRevertFiles([]);
              setForwardMessage('');
              setForwardFiles([]);
              setSelectedEmployees([]);
            }}
            className={`group relative flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${colors.inputBg} ${colors.inputBorder} ${colors.textPrimary} flex items-center justify-center gap-2`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
            ></div>
            <X className="w-4 h-4 relative z-10 group-hover:rotate-90 transition-all duration-300" />
            <span className="relative z-10">Back</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`group relative flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} flex items-center justify-center gap-2`}
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
                <Send className="w-4 h-4 relative z-10 group-hover:rotate-12 group-hover:translate-x-1 transition-all duration-300" />
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
  const prevNode = getPrevNode();

  return (
    <div className="grid grid-cols-2 gap-3">
      {availableActions.includes('mark_in_progress') && (
        <ActionButton
          icon={<Play className="w-5 h-5" />}
          label="Mark In Progress"
          description="Start working on ticket"
          character={cardCharacters.completed}
          colors={colors}
          onClick={() => handleActionClick('mark_in_progress')}
        />
      )}

      {availableActions.includes('forward') && nextNode && (
        <ActionButton
          icon={<ArrowRight className="w-5 h-5" />}
          label={nextNode.type === 'end' ? 'Complete' : `Forward to ${nextNode.data?.label || 'Next'}`}
          description={nextNode.type === 'end' ? 'Mark as resolved' : 'Move to next stage'}
          character={cardCharacters.informative}
          colors={colors}
          onClick={() => handleActionClick('forward')}
        />
      )}

      {availableActions.includes('revert') && prevNode && (
        <ActionButton
          icon={<Undo2 className="w-5 h-5" />}
          label={`Revert to ${prevNode.data?.label || 'Previous'}`}
          description="Send back for rework"
          character={cardCharacters.interactive}
          colors={colors}
          onClick={() => handleActionClick('revert')}
        />
      )}

      {availableActions.includes('report_blocker') && (
        <ActionButton
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Report Blocker"
          description="Flag an issue"
          character={cardCharacters.interactive}
          colors={colors}
          onClick={() => handleActionClick('report_blocker')}
        />
      )}

      {availableActions.includes('reassign') && (
        <ActionButton
          icon={<UserPlus className="w-5 h-5" />}
          label="Reassign"
          description="Assign to another"
          character={cardCharacters.authoritative}
          colors={colors}
          onClick={() => handleActionClick('reassign')}
        />
      )}

      {availableActions.includes('form_group') && (
        <ActionButton
          icon={<Users className="w-5 h-5" />}
          label="Form Group"
          description="Create team"
          character={cardCharacters.creative}
          colors={colors}
          onClick={() => handleActionClick('form_group')}
        />
      )}

      {availableActions.includes('blocker_resolved') && (
        <ActionButton
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Resolve Blocker"
          description="Mark blocker resolved"
          character={cardCharacters.completed}
          colors={colors}
          onClick={() => handleActionClick('blocker_resolved')}
        />
      )}
    </div>
  );
}

// Action Button Component - THEME COMPLIANT (NO SCALE)
function ActionButton({ icon, label, description, character, colors, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden bg-gradient-to-br ${character.bg} ${character.border}`}
    >
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
      ></div>
      
      <div className="relative">
        <div 
          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-gradient-to-r ${character.bg} ${character.iconColor}`}
        >
          {React.cloneElement(icon, {
            className: `w-5 h-5 group-hover:rotate-12 transition-all duration-300`
          })}
        </div>
        <p className={`font-bold ${character.text} mb-1`}>{label}</p>
        <p className={`text-xs ${colors.textMuted}`}>
          {description}
        </p>
      </div>
    </button>
  );
}