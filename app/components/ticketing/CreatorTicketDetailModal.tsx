// ============================================
// app/components/ticketing/CreatorTicketDetailModal.tsx
// UPDATED: Detailed history view matching TicketDetailModal + assignee names
// ============================================

'use client';

import React, { useState } from 'react';
import { 
  X, 
  Loader2, 
  AlertTriangle, 
  Clock, 
  User,
  CheckCircle,
  XCircle,
  RotateCcw,
  Send,
  Info,
  AlertCircle as AlertCircleIcon,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  File,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Undo2,
  Activity
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Ticket {
  _id: string;
  ticketNumber: string;
  functionalityName: string;
  status: string;
  priority: string;
  workflowStage: string;
  createdAt: string;
  blockers: any[];
  currentAssignee: string;
  currentAssignees: string[];
  groupLead: string | null;
  raisedBy: {
    userId: string;
    name: string;
  };
  functionality: any;
  workflowHistory: any[];
  formData?: Record<string, any>;
}

interface Props {
  ticket: Ticket;
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CreatorTicketDetailModal({ ticket, userId, onClose, onUpdate }: Props) {
  const { colors, cardCharacters, getModalStyles, showToast } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<number[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const isCreator = ticket.raisedBy.userId === userId;
  const isClosed = ticket.status === 'closed';
  const isResolved = ticket.status === 'resolved';
  const hasUnresolvedBlockers = ticket.blockers?.some((b: any) => !b.isResolved);

  const toggleHistoryExpansion = (index: number) => {
    setExpandedHistory(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // ✅ Convert database paths to API URLs
  const getAttachmentUrl = (attachmentPath: string): string => {
    console.log('🔗 Converting path:', attachmentPath);
    
    // Handle absolute Windows paths (D:\ARDA\uploads\tickets\TKT-XXX\file.pdf)
    if (attachmentPath.match(/^[A-Za-z]:\\/)) {
      const match = attachmentPath.match(/uploads[\\\/]tickets[\\\/](.+)/i);
      if (match) {
        const relativePath = match[1].replace(/\\/g, '/');
        const apiUrl = `/api/attachments/${relativePath}`;
        console.log('   Absolute → API:', apiUrl);
        return apiUrl;
      }
    }
    
    // Handle relative paths (uploads/tickets/TKT-XXX/file.pdf)
    if (attachmentPath.toLowerCase().includes('uploads')) {
      const match = attachmentPath.match(/uploads[\\\/]tickets[\\\/](.+)/i);
      if (match) {
        const relativePath = match[1].replace(/\\/g, '/');
        const apiUrl = `/api/attachments/${relativePath}`;
        console.log('   Relative → API:', apiUrl);
        return apiUrl;
      }
    }
    
    // Already an API path
    if (attachmentPath.startsWith('/api/')) {
      console.log('   Already API path');
      return attachmentPath;
    }
    
    console.warn('   ⚠️ Could not parse path');
    return attachmentPath;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'reverted':
        return <Undo2 className="w-4 h-4" />;
      case 'forwarded':
        return <ArrowRight className="w-4 h-4" />;
      case 'in_progress':
      case 'mark_in_progress':
        return <Clock className="w-4 h-4" />;
      case 'blocker_reported':
        return <AlertTriangle className="w-4 h-4" />;
      case 'blocker_resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <ArrowRight className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'reverted':
        return cardCharacters.interactive;
      case 'blocker_reported':
        return cardCharacters.urgent;
      case 'blocker_resolved':
      case 'resolved':
        return cardCharacters.completed;
      case 'forwarded':
        return cardCharacters.informative;
      default:
        return cardCharacters.neutral;
    }
  };

  const getFirstEmployeeNode = () => {
    if (!ticket.functionality?.workflow) return null;
    
    const workflow = ticket.functionality.workflow;
    const startNode = workflow.nodes.find((n: any) => n.type === 'start');
    if (!startNode) return null;
    
    const firstEdge = workflow.edges.find((e: any) => e.source === startNode.id);
    if (!firstEdge) return null;
    
    const firstNode = workflow.nodes.find((n: any) => n.id === firstEdge.target);
    return firstNode;
  };

  const showConfirmation = (type: string, title: string, message: string, onConfirm: () => void) => {
    setConfirmAction({ type, title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction.onConfirm();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const performAction = async (actionType: string) => {
    if (!isCreator) {
      showToast('Only the ticket creator can perform this action', 'error');
      return;
    }

    if (actionType === 'reopen' && !explanation) {
      showToast('Please provide a reason for reopening this ticket', 'warning');
      return;
    }

    try {
      setLoading(true);

      const userData = localStorage.getItem('user');
      if (!userData) {
        showToast('User not logged in', 'error');
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(userData);
      const userName = user.basicDetails?.name || user.displayName || user.username || 'Unknown User';
      const apiUserId = user._id || userId;

      const payload: any = {
        action: actionType,
        performedBy: {
          userId: apiUserId,
          name: userName
        }
      };

      if (actionType === 'reopen') {
        const firstNode = getFirstEmployeeNode();
        if (!firstNode) {
          showToast('Cannot find first workflow node', 'error');
          setLoading(false);
          return;
        }
        payload.toNode = firstNode.id;
        payload.explanation = explanation;
      }

      const response = await fetch(`/api/tickets/${ticket._id}/actions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      showToast('Action performed successfully!', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('❌ Error performing action:', error);
      showToast(error instanceof Error ? error.message : 'Failed to perform action', 'error');
    } finally {
      setLoading(false);
      setSelectedAction(null);
      setExplanation('');
    }
  };

  const handleCloseTicket = () => {
    showConfirmation(
      'close',
      'Close Ticket',
      'Are you sure you want to close this ticket? This action marks the ticket as complete.',
      () => performAction('close')
    );
  };

  const handleResolveBlocker = () => {
    showConfirmation(
      'resolve-blocker',
      'Resolve Blocker',
      'Are you sure you want to mark this blocker as resolved?',
      () => performAction('blocker_resolved')
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return cardCharacters.interactive;
      case 'in-progress': return cardCharacters.informative;
      case 'blocked': return cardCharacters.urgent;
      case 'resolved': return cardCharacters.completed;
      case 'closed': return cardCharacters.neutral;
      default: return cardCharacters.informative;
    }
  };

  const statusCharColors = getStatusColor(ticket.status);

  // ✅ Get assignee names
  const getAssigneeNames = () => {
    if (ticket.currentAssignees && ticket.currentAssignees.length > 0) {
      return ticket.currentAssignees.join(', ');
    }
    if (ticket.currentAssignee) {
      return ticket.currentAssignee;
    }
    return 'Unassigned';
  };

  // ✅ Extract form attachments
  const formAttachments = ticket.formData?.['default-attachments'] || [];

  return (
    <>
      <div className={getModalStyles()}>
        <div className="absolute inset-0 modal-backdrop" onClick={onClose} aria-hidden="true" />
        
        <div 
          className={`
            relative rounded-2xl border ${colors.modalBorder}
            ${colors.modalBg} ${colors.modalShadow}
            w-full max-w-4xl
            modal-content flex flex-col
          `}
          style={{ overflow: 'hidden' }}
        >
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03] pointer-events-none`}></div>

          {/* Header */}
          <div className={`
            relative px-6 py-4 border-b ${colors.modalFooterBorder}
            ${colors.modalHeaderBg}
          `}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className={`text-2xl font-black ${colors.modalHeaderText}`}>
                    {ticket.ticketNumber}
                  </h2>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${statusCharColors.bg} ${statusCharColors.text}`}
                  >
                    {ticket.status.toUpperCase().replace('-', ' ')}
                  </div>
                </div>
                <p className={`text-sm ${colors.textSecondary}`}>
                  {ticket.functionalityName}
                </p>
              </div>
              
              <button
                onClick={onClose}
                className={`group relative p-2 rounded-lg transition-all duration-300 ${colors.buttonGhost} ${colors.buttonGhostText}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 px-6 py-3 font-bold text-sm transition-all duration-300 rounded-t-lg relative ${
                  activeTab === 'details'
                    ? `${charColors.accent}`
                    : colors.textSecondary
                }`}
              >
                {activeTab === 'details' && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                    style={{ backgroundColor: charColors.iconColor.replace('text-', '') }}
                  />
                )}
                <span className="relative z-10">Details</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-6 py-3 font-bold text-sm transition-all duration-300 rounded-t-lg relative ${
                  activeTab === 'history'
                    ? `${charColors.accent}`
                    : colors.textSecondary
                }`}
              >
                {activeTab === 'history' && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                    style={{ backgroundColor: charColors.iconColor.replace('text-', '') }}
                  />
                )}
                <span className="relative z-10">History</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={`relative p-6 ${colors.modalContentBg} max-h-[calc(90vh-200px)] overflow-y-auto`}>
            <div className={colors.modalContentText}>
              {activeTab === 'details' ? (
                <div className="space-y-4">
                  {/* Ticket Info */}
                  <div 
                    className={`relative overflow-hidden p-4 rounded-xl border-2 bg-gradient-to-br ${charColors.bg} ${charColors.border}`}
                  >
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                    <div className="relative grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs ${colors.textMuted} mb-1 font-bold`}>Priority</p>
                        <p className={`font-semibold ${colors.textPrimary} capitalize`}>
                          {ticket.priority}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.textMuted} mb-1 font-bold`}>Created</p>
                        <p className={`font-semibold ${colors.textPrimary}`}>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.textMuted} mb-1 font-bold`}>Assigned To</p>
                        <p className={`font-semibold ${colors.textPrimary}`}>
                          {getAssigneeNames()}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.textMuted} mb-1 font-bold`}>Assignees Count</p>
                        <p className={`font-semibold ${colors.textPrimary}`}>
                          {ticket.currentAssignees?.length || 1} person{ticket.currentAssignees?.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Data Display */}
                  {ticket.formData && Object.keys(ticket.formData).length > 0 && (
                    <div>
                      <h3 className={`font-bold ${colors.textPrimary} mb-3 flex items-center gap-2`}>
                        <Info className={`w-5 h-5 ${charColors.iconColor}`} />
                        Submitted Information
                      </h3>
                      <div 
                        className={`relative overflow-hidden p-4 rounded-xl space-y-3 max-h-96 overflow-y-auto border-2 ${colors.inputBg} ${colors.inputBorder}`}
                      >
                        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                        <div className="relative space-y-3">
                          {Object.entries(ticket.formData).map(([key, value]) => {
                            if (key === 'default-attachments') return null;
                            
                            const label = key
                              .replace('default-', '')
                              .replace(/-/g, ' ')
                              .replace(/field-\d+/, 'Custom Field')
                              .replace(/\b\w/g, (l: string) => l.toUpperCase());
                            
                            return (
                              <div key={key} className={`pb-3 border-b last:border-b-0 ${colors.borderSubtle}`}>
                                <p className={`text-xs font-bold ${colors.textMuted} mb-1 uppercase`}>
                                  {label}
                                </p>
                                <div className={`text-sm ${colors.textPrimary}`}>
                                  {Array.isArray(value) ? (
                                    value.length > 0 && typeof value[0] === 'object' ? (
                                      <span className="text-xs">Table data ({value.length} rows)</span>
                                    ) : (
                                      value.join(', ')
                                    )
                                  ) : (
                                    String(value)
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* ✅ Form Attachments Section */}
                          {formAttachments.length > 0 && (
                            <div className={`pt-3 border-t ${colors.borderSubtle}`}>
                              <p className={`text-xs font-bold ${colors.textMuted} mb-3 uppercase flex items-center gap-2`}>
                                <Paperclip className="w-4 h-4" />
                                📎 Form Attachments ({formAttachments.length})
                              </p>
                              <div className="space-y-2">
                                {formAttachments.map((attachment: string, idx: number) => {
                                  const fileName = attachment.split(/[\\\/]/).pop() || attachment;
                                  const fileUrl = getAttachmentUrl(attachment);
                                  
                                  return (
                                    <a
                                      key={idx}
                                      href={fileUrl}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`
                                        group relative flex items-center gap-3 p-3 rounded-lg border-2 
                                        transition-all duration-300 overflow-hidden
                                        ${colors.inputBg} ${colors.inputBorder}
                                      `}
                                    >
                                      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                                      
                                      <div 
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                                      ></div>
                                      
                                      <div className={`relative z-10 p-2 rounded-lg bg-gradient-to-r ${charColors.bg} ${charColors.iconColor}`}>
                                        {getFileIcon(fileName)}
                                      </div>
                                      <div className="relative z-10 flex-1 min-w-0">
                                        <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>
                                          {fileName}
                                        </p>
                                        <p className={`text-xs ${colors.textMuted}`}>
                                          Submitted with form
                                        </p>
                                      </div>
                                      <Download className={`relative z-10 w-4 h-4 ${colors.textMuted} group-hover:${charColors.iconColor} group-hover:translate-x-1 transition-all duration-300`} />
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blockers Section */}
                  {ticket.blockers && ticket.blockers.length > 0 && (
                    <div>
                      <h3 className={`font-bold ${colors.textPrimary} mb-3 flex items-center gap-2`}>
                        <AlertTriangle className={`w-5 h-5 ${cardCharacters.urgent.iconColor}`} />
                        Blockers
                      </h3>
                      <div className="space-y-2">
                        {ticket.blockers.map((blocker: any, index: number) => (
                          <div 
                            key={index}
                            className={`relative overflow-hidden p-4 rounded-lg border-2 ${
                              blocker.isResolved 
                                ? `bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border}`
                                : `bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border}`
                            }`}
                          >
                            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                            <div className="relative flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className={`text-sm font-semibold ${colors.textPrimary} mb-1`}>
                                  {blocker.description}
                                </p>
                                <p className={`text-xs ${colors.textMuted}`}>
                                  Reported by {blocker.reportedByName} • {new Date(blocker.reportedAt).toLocaleDateString()}
                                </p>
                              </div>
                              {!blocker.isResolved && isCreator && (
                                <button
                                  onClick={handleResolveBlocker}
                                  disabled={loading}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text}`}
                                >
                                  {loading ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Resolving...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      Resolve
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            {blocker.isResolved && (
                              <p className={`text-xs mt-2 flex items-center gap-1 ${cardCharacters.completed.text}`}>
                                <CheckCircle className="w-3 h-3" />
                                Resolved by {blocker.resolvedByName} on {new Date(blocker.resolvedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info Box for Non-Creators */}
                  {!isCreator && (
                    <div 
                      className={`relative overflow-hidden p-4 rounded-xl flex items-start gap-3 border-2 bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border}`}
                    >
                      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                      <Info className={`w-5 h-5 ${cardCharacters.informative.iconColor} flex-shrink-0 mt-0.5 relative z-10`} />
                      <div className="relative z-10">
                        <p className={`text-sm font-semibold ${colors.textPrimary} mb-1`}>
                          View Only
                        </p>
                        <p className={`text-xs ${colors.textSecondary}`}>
                          Only the ticket creator can resolve blockers, close, or reopen tickets.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons for Creator */}
                  {isCreator && !selectedAction && (
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      {isResolved && !isClosed && (
                        <ActionButton
                          icon={<XCircle className="w-5 h-5" />}
                          label="Close Ticket"
                          description="Mark as complete"
                          character={cardCharacters.neutral}
                          onClick={handleCloseTicket}
                          disabled={loading}
                        />
                      )}

                      {(isClosed || isResolved) && (
                        <ActionButton
                          icon={<RotateCcw className="w-5 h-5" />}
                          label="Reopen Ticket"
                          description="Restart workflow"
                          character={cardCharacters.interactive}
                          onClick={() => setSelectedAction('reopen')}
                          disabled={loading}
                        />
                      )}
                    </div>
                  )}

                  {/* Reopen Explanation Form */}
                  {selectedAction === 'reopen' && (
                    <div className="space-y-4 pt-4">
                      <div 
                        className={`relative overflow-hidden p-4 rounded-xl border-2 bg-gradient-to-br ${cardCharacters.interactive.bg} ${cardCharacters.interactive.border}`}
                      >
                        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                        <div className="relative">
                          <p className={`font-semibold ${colors.textPrimary} mb-2`}>
                            Reopen Ticket
                          </p>
                          <p className={`text-xs ${colors.textSecondary}`}>
                            This will reset the ticket to the beginning of the workflow and mark it as "pending".
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                          Reason for Reopening (Required) *
                        </label>
                        <textarea
                          value={explanation}
                          onChange={(e) => setExplanation(e.target.value)}
                          placeholder="Explain why this ticket needs to be reopened..."
                          rows={4}
                          className={`w-full px-4 py-3 rounded-lg text-sm resize-none transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedAction(null);
                            setExplanation('');
                          }}
                          disabled={loading}
                          className={`group relative flex-1 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${colors.buttonSecondary} ${colors.buttonSecondaryText} disabled:opacity-50`}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => performAction('reopen')}
                          disabled={loading || !explanation}
                          className={`group relative flex-1 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden border-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
                        >
                          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                              <span className="relative z-10">Reopening...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 relative z-10" />
                              <span className="relative z-10">Confirm Reopen</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ✅ Enhanced History Tab with Attachments */
                <div className="space-y-3">
                  <h3 className={`font-bold ${colors.textPrimary} mb-4 flex items-center gap-2`}>
                    <Activity className="w-5 h-5" />
                    Workflow History
                  </h3>
                  {ticket.workflowHistory && ticket.workflowHistory.length > 0 ? (
                    ticket.workflowHistory.slice().reverse().map((entry: any, index: number) => {
                      const isExpanded = expandedHistory.includes(index);
                      const hasDetails = entry.explanation || entry.attachments?.length > 0 || entry.blockerDescription;
                      const actionColor = getActionColor(entry.actionType);
                      const isRevert = entry.actionType === 'reverted';

                      return (
                        <div 
                          key={index}
                          className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                            isRevert 
                              ? `bg-gradient-to-br ${cardCharacters.interactive.bg} ${cardCharacters.interactive.border}`
                              : `${colors.cardBg} ${colors.border}`
                          }`}
                        >
                          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                          
                          <div className="relative p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2.5 rounded-lg bg-gradient-to-r ${actionColor.bg} ${actionColor.iconColor} flex-shrink-0`}>
                                {getActionIcon(entry.actionType)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1">
                                    <p className={`font-bold ${isRevert ? cardCharacters.interactive.text : colors.textPrimary} text-base leading-tight`}>
                                      {entry.actionType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </p>
                                    <p className={`text-xs ${colors.textMuted} mt-1 flex items-center gap-1.5`}>
                                      <User className="w-3 h-3" />
                                      {entry.performedBy?.name} • {new Date(entry.performedAt).toLocaleString()}
                                    </p>
                                  </div>
                                  
                                  {hasDetails && (
                                    <button
                                      onClick={() => toggleHistoryExpansion(index)}
                                      className={`group relative p-1.5 rounded-lg transition-all duration-300 overflow-hidden ${colors.buttonGhost} ${colors.buttonGhostText}`}
                                    >
                                      <div 
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{ boxShadow: `inset 0 0 10px ${colors.glowSecondary}` }}
                                      ></div>
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 relative z-10 group-hover:translate-y-[-2px] transition-all duration-300" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 relative z-10 group-hover:translate-y-[2px] transition-all duration-300" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                {!isExpanded && (entry.explanation || entry.blockerDescription) && (
                                  <p className={`text-xs ${colors.textSecondary} italic line-clamp-2 mt-2`}>
                                    {entry.explanation || entry.blockerDescription}
                                  </p>
                                )}
                                
                                {!isExpanded && entry.attachments?.length > 0 && (
                                  <div className={`flex items-center gap-2 mt-2 text-xs ${colors.textMuted}`}>
                                    <Paperclip className="w-3 h-3" />
                                    <span>{entry.attachments.length} attachment{entry.attachments.length > 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && hasDetails && (
                              <div className={`mt-4 pt-4 border-t ${colors.borderSubtle} space-y-4`}>
                                {(entry.explanation || entry.blockerDescription) && (
                                  <div 
                                    className={`p-4 rounded-lg border-2 ${
                                      isRevert 
                                        ? `${cardCharacters.interactive.border} bg-gradient-to-r ${cardCharacters.interactive.bg}`
                                        : `${colors.borderSubtle} ${colors.inputBg}`
                                    }`}
                                  >
                                    <p className={`text-xs font-bold ${colors.textMuted} mb-2 uppercase flex items-center gap-2`}>
                                      <FileText className="w-4 h-4" />
                                      {isRevert ? '📨 Revert Message' : entry.blockerDescription ? '🚧 Blocker Description' : '💬 Explanation'}
                                    </p>
                                    <p className={`text-sm ${isRevert ? cardCharacters.interactive.text : colors.textPrimary} leading-relaxed whitespace-pre-wrap`}>
                                      {entry.explanation || entry.blockerDescription}
                                    </p>
                                  </div>
                                )}

                                {/* ✅ Workflow History Attachments */}
                                {entry.attachments && entry.attachments.length > 0 && (
                                  <div>
                                    <p className={`text-xs font-bold ${colors.textMuted} mb-3 uppercase flex items-center gap-2`}>
                                      <Paperclip className="w-4 h-4" />
                                      📎 Attachments ({entry.attachments.length})
                                    </p>
                                    <div className="space-y-2">
                                      {entry.attachments.map((attachment: string, aIdx: number) => {
                                        const fileName = attachment.split(/[\\\/]/).pop() || attachment;
                                        const fileUrl = getAttachmentUrl(attachment);
                                        
                                        return (
                                          <a
                                            key={aIdx}
                                            href={fileUrl}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`
                                              group relative flex items-center gap-3 p-3 rounded-lg border-2 
                                              transition-all duration-300 overflow-hidden
                                              ${colors.inputBg} ${colors.inputBorder}
                                            `}
                                          >
                                            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                                            
                                            <div 
                                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                              style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                                            ></div>
                                            
                                            <div className={`relative z-10 p-2 rounded-lg bg-gradient-to-r ${actionColor.bg} ${actionColor.iconColor}`}>
                                              {getFileIcon(fileName)}
                                            </div>
                                            <div className="relative z-10 flex-1 min-w-0">
                                              <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>
                                                {fileName}
                                              </p>
                                              <p className={`text-xs ${colors.textMuted}`}>
                                                Click to download or view
                                              </p>
                                            </div>
                                            <Download className={`relative z-10 w-5 h-5 ${colors.textMuted} group-hover:${actionColor.iconColor} group-hover:translate-x-1 transition-all duration-300`} />
                                          </a>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {entry.groupMembers && entry.groupMembers.length > 0 && (
                                  <div>
                                    <p className={`text-xs font-bold ${colors.textMuted} mb-2 uppercase`}>
                                      👥 Group Members ({entry.groupMembers.length})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {entry.groupMembers.map((member: any, mIdx: number) => (
                                        <span
                                          key={mIdx}
                                          className={`
                                            px-3 py-1.5 rounded-full text-xs font-semibold
                                            ${member.isLead 
                                              ? `bg-gradient-to-r ${cardCharacters.authoritative.bg} ${cardCharacters.authoritative.text}`
                                              : `bg-gradient-to-r ${charColors.bg} ${charColors.text}`
                                            }
                                          `}
                                        >
                                          {member.isLead && '👑 '}{member.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={`p-6 rounded-xl text-center border-2 ${colors.inputBorder} ${colors.inputBg}`}>
                      <Clock className={`w-8 h-8 ${colors.textMuted} mx-auto mb-2`} />
                      <p className={`text-sm ${colors.textMuted}`}>No workflow actions yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {!selectedAction && (
            <div className={`
              relative px-6 py-4 border-t ${colors.modalFooterBorder}
              ${colors.modalFooterBg}
            `}>
              <button
                onClick={onClose}
                className={`group relative w-full px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${colors.buttonSecondary} ${colors.buttonSecondaryText}`}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className={getModalStyles()}>
          <div className="absolute inset-0 modal-backdrop" onClick={handleCancel} aria-hidden="true" />
          
          <div 
            className={`
              relative rounded-2xl border ${colors.modalBorder}
              ${colors.modalBg} ${colors.modalShadow}
              w-full max-w-md
              modal-content
            `}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03] pointer-events-none`}></div>

            {/* Confirmation Content */}
            <div className="relative p-6 space-y-4">
              {/* Icon */}
              <div className="flex justify-center">
                <div className={`p-3 rounded-full bg-gradient-to-r ${cardCharacters.urgent.bg}`}>
                  <AlertCircleIcon className={`w-8 h-8 ${cardCharacters.urgent.iconColor}`} />
                </div>
              </div>

              {/* Title and Message */}
              <div className="text-center space-y-2">
                <h3 className={`text-xl font-black ${colors.modalHeaderText}`}>
                  {confirmAction.title}
                </h3>
                <p className={`text-sm ${colors.textSecondary}`}>
                  {confirmAction.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className={`group relative flex-1 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${colors.buttonSecondary} ${colors.buttonSecondaryText}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`group relative flex-1 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <span className="relative z-10">Confirm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Action Button Component
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  character: any;
  onClick: () => void;
  disabled?: boolean;
}

function ActionButton({ icon, label, description, character, onClick, disabled }: ActionButtonProps) {
  const { colors } = useTheme();
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative p-4 rounded-xl border-2 transition-all hover:scale-105 text-left disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden bg-gradient-to-br ${character.bg} ${character.border}`}
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