// ============================================
// app/components/ticketing/CreatorTicketDetailModal.tsx
// UPDATED WITH THEME CONTEXT MODAL STYLES
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
  Info
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
  raisedBy: {
    userId: string;
    name: string;
  };
  functionality: any;
  workflowHistory: any[];
}

interface Props {
  ticket: Ticket;
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CreatorTicketDetailModal({ ticket, userId, onClose, onUpdate }: Props) {
  const { colors, cardCharacters, getModalStyles } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');

  const isCreator = ticket.raisedBy.userId === userId;
  const isClosed = ticket.status === 'closed';
  const isResolved = ticket.status === 'resolved';
  const hasUnresolvedBlockers = ticket.blockers?.some((b: any) => !b.isResolved);

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

  const performAction = async (actionType: string) => {
    if (!isCreator) {
      alert('Only the ticket creator can perform this action');
      return;
    }

    if (actionType === 'reopen' && !explanation) {
      alert('Please provide a reason for reopening this ticket');
      return;
    }

    try {
      setLoading(true);

      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('User not logged in');
      
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
          throw new Error('Cannot find first workflow node');
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

      alert('✅ Action performed successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('❌ Error performing action:', error);
      alert(error instanceof Error ? error.message : 'Failed to perform action');
    } finally {
      setLoading(false);
      setSelectedAction(null);
      setExplanation('');
    }
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

  return (
    <div className={getModalStyles()}>
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} aria-hidden="true" />
      
      <div 
        className={`
          relative rounded-2xl border ${colors.modalBorder}
          ${colors.modalBg} ${colors.modalShadow}
          w-full max-w-3xl
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
                      <p className={`text-xs ${colors.textMuted} mb-1`}>Priority</p>
                      <p className={`font-semibold ${colors.textPrimary} capitalize`}>
                        {ticket.priority}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.textMuted} mb-1`}>Created</p>
                      <p className={`font-semibold ${colors.textPrimary}`}>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.textMuted} mb-1`}>Current Assignees</p>
                      <p className={`font-semibold ${colors.textPrimary}`}>
                        {ticket.currentAssignees?.length || 1} person{ticket.currentAssignees?.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.textMuted} mb-1`}>Workflow Stage</p>
                      <p className={`font-semibold ${colors.textPrimary}`}>
                        {ticket.workflowStage}
                      </p>
                    </div>
                  </div>
                </div>

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
                                onClick={() => performAction('blocker_resolved')}
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
                        onClick={() => performAction('close')}
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
              /* History Tab */
              <div className="space-y-3">
                {ticket.workflowHistory && ticket.workflowHistory.length > 0 ? (
                  ticket.workflowHistory.slice().reverse().map((entry: any, index: number) => (
                    <div 
                      key={index}
                      className={`relative overflow-hidden p-4 rounded-lg border ${colors.inputBorder} ${colors.inputBg}`}
                    >
                      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                      <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className={`w-4 h-4 ${colors.textMuted}`} />
                            <p className={`text-sm font-bold ${colors.textPrimary}`}>
                              {entry.actionType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </p>
                          </div>
                          {entry.explanation && (
                            <p className={`text-sm ${colors.textSecondary} mb-2 pl-6`}>
                              "{entry.explanation}"
                            </p>
                          )}
                          {entry.blockerDescription && (
                            <p className={`text-sm ${colors.textSecondary} mb-2 pl-6`}>
                              Blocker: "{entry.blockerDescription}"
                            </p>
                          )}
                          <div className="flex items-center gap-2 pl-6">
                            <User className={`w-3 h-3 ${colors.textMuted}`} />
                            <p className={`text-xs ${colors.textMuted}`}>
                              {entry.performedBy?.name} • {new Date(entry.performedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`relative overflow-hidden p-8 rounded-xl border text-center ${colors.inputBorder} ${colors.inputBg}`}>
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                    <Clock className={`relative w-12 h-12 ${colors.textMuted} mx-auto mb-3 opacity-50`} />
                    <p className={`relative ${colors.textSecondary} text-sm`}>
                      No history available
                    </p>
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