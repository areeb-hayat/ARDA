// ============================================
// app/components/ticketing/TicketDetailModal.tsx
// View ticket details and take actions (for creators)
// UPDATED WITH THEME CONTEXT MODAL STYLES
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Loader2, AlertCircle, CheckCircle, Clock, ArrowRight,
  FileText, User, Calendar, Tag, Activity, AlertTriangle
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Ticket {
  _id: string;
  ticketNumber: string;
  functionalityName: string;
  status: string;
  priority: string;
  workflowStage: string;
  formData: Record<string, any>;
  raisedBy: {
    userId: string;
    name: string;
    email: string;
  };
  workflowHistory: any[];
  blockers: any[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  ticketId: string;
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TicketDetailModal({ ticketId, userId, onClose, onUpdate }: Props) {
  const { colors, cardCharacters, getModalStyles } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockerText, setBlockerText] = useState('');
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets/${ticketId}`);
      
      if (!response.ok) throw new Error('Failed to fetch ticket');

      const data = await response.json();
      setTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string, additionalData: any = {}) => {
    try {
      setActionLoading(true);
      
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('User not logged in');
      
      const user = JSON.parse(userData);

      const response = await fetch(`/api/tickets/${ticketId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: user._id || user.id || user.userId || user.username,
          userName: user.basicDetails?.name || user.displayName || user.username,
          ...additionalData
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Action failed');
      }

      await fetchTicket();
      setExplanation('');
      setBlockerText('');
      
      alert('Action performed successfully!');
      
      if (['close_ticket', 'resolve_ticket'].includes(action)) {
        onUpdate();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveBlocker = () => {
    if (window.confirm('Are you sure you want to resolve this blocker?')) {
      performAction('resolve_blocker');
    }
  };

  const handleResolveTicket = () => {
    if (window.confirm('Are you sure you want to resolve this ticket? This will bypass the workflow.')) {
      performAction('resolve_ticket', { explanation });
    }
  };

  const handleCloseTicket = () => {
    if (window.confirm('Are you sure you want to close this ticket?')) {
      performAction('close_ticket');
    }
  };

  const handleReopenTicket = () => {
    const reason = prompt('Please provide a reason for reopening this ticket:');
    if (reason) {
      performAction('reopen_ticket', { explanation: reason });
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

  if (loading) {
    return (
      <div className={getModalStyles()}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`w-12 h-12 animate-spin ${charColors.iconColor}`} />
          <p className={colors.textPrimary}>Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className={getModalStyles()}>
        <div className="absolute inset-0 modal-backdrop" onClick={onClose} aria-hidden="true" />
        
        <div className={`
          relative rounded-2xl border ${colors.modalBorder}
          ${colors.modalBg} ${colors.modalShadow}
          w-full max-w-md p-8
          modal-content
        `}
          style={{ overflow: 'hidden' }}
        >
          <AlertCircle className={`w-12 h-12 ${cardCharacters.urgent.iconColor} mx-auto mb-4`} />
          <p className={`text-center ${colors.textPrimary} mb-4`}>{error || 'Ticket not found'}</p>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-lg font-bold bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isCreator = ticket.raisedBy.userId === userId;
  const hasUnresolvedBlockers = ticket.blockers?.some((b: any) => !b.isResolved) || false;
  const statusCharColors = getStatusColor(ticket.status);

  return (
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${statusCharColors.bg}`}>
                <FileText className={`w-6 h-6 ${statusCharColors.iconColor}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${colors.modalHeaderText}`}>
                  {ticket.ticketNumber}
                </h2>
                <p className={`text-sm ${colors.textSecondary}`}>
                  {ticket.functionalityName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`group relative p-2 rounded-lg transition-all duration-300 ${colors.buttonGhost} ${colors.buttonGhostText}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`relative p-6 ${colors.modalContentBg} max-h-[calc(90vh-180px)] overflow-y-auto`}>
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${colors.modalContentText}`}>
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <div className={`p-4 rounded-xl border ${colors.border} bg-gradient-to-r ${colors.cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold ${colors.textPrimary}`}>Status</h3>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${statusCharColors.bg} ${statusCharColors.text}`}
                  >
                    {ticket.status.toUpperCase().replace('-', ' ')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={colors.textMuted}>Priority</p>
                    <p className={`font-semibold ${colors.textPrimary} capitalize`}>
                      {ticket.priority}
                    </p>
                  </div>
                  <div>
                    <p className={colors.textMuted}>Created</p>
                    <p className={`font-semibold ${colors.textPrimary}`}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Blockers */}
              {ticket.blockers && ticket.blockers.length > 0 && (
                <div className={`p-4 rounded-xl border-2 bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className={`w-5 h-5 ${cardCharacters.urgent.iconColor}`} />
                    <h3 className={`font-bold ${cardCharacters.urgent.text}`}>Blockers</h3>
                  </div>
                  <div className="space-y-3">
                    {ticket.blockers.map((blocker: any, idx: number) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-lg ${colors.cardBg}`}
                        style={{ opacity: blocker.isResolved ? 0.5 : 1 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className={`text-sm ${colors.textPrimary}`}>
                            {blocker.description}
                          </p>
                          {blocker.isResolved && (
                            <CheckCircle className={`w-4 h-4 ${cardCharacters.completed.iconColor} flex-shrink-0 ml-2`} />
                          )}
                        </div>
                        <p className={`text-xs ${colors.textMuted}`}>
                          Reported by {blocker.reportedByName} on{' '}
                          {new Date(blocker.reportedAt).toLocaleDateString()}
                        </p>
                        {blocker.isResolved && (
                          <p className={`text-xs ${cardCharacters.completed.text} mt-1`}>
                            Resolved by {blocker.resolvedByName} on{' '}
                            {new Date(blocker.resolvedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {isCreator && hasUnresolvedBlockers && (
                    <button
                      onClick={handleResolveBlocker}
                      disabled={actionLoading}
                      className={`mt-3 w-full py-2 rounded-lg font-semibold text-sm bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text} transition-colors disabled:opacity-50`}
                    >
                      {actionLoading ? 'Resolving...' : 'Resolve Blocker'}
                    </button>
                  )}
                </div>
              )}

              {/* Workflow History */}
              <div>
                <h3 className={`font-bold ${colors.textPrimary} mb-3 flex items-center gap-2`}>
                  <Activity className="w-5 h-5" />
                  Workflow History
                </h3>
                <div className="space-y-3">
                  {ticket.workflowHistory && ticket.workflowHistory.length > 0 ? (
                    ticket.workflowHistory.map((action: any, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r ${statusCharColors.bg}`}>
                          <ArrowRight className={`w-4 h-4 ${statusCharColors.iconColor}`} />
                        </div>
                        {idx < ticket.workflowHistory.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[20px] ${colors.border}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className={`font-semibold ${colors.textPrimary} text-sm`}>
                          {action.actionType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </p>
                        <p className={`text-xs ${colors.textMuted}`}>
                          By {action.performedBy.name} •{' '}
                          {new Date(action.performedAt).toLocaleString()}
                        </p>
                        {action.explanation && (
                          <p className={`text-xs ${colors.textSecondary} mt-1 italic`}>
                            "{action.explanation}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className={`p-4 rounded-lg text-center ${colors.textMuted}`}>
                      <p className="text-sm">No workflow actions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Form Data */}
            <div className="space-y-4">
              <h3 className={`font-bold ${colors.textPrimary} mb-3`}>Submitted Data</h3>
              <div className="space-y-3">
                {Object.entries(ticket.formData).map(([key, value]) => (
                  <div 
                    key={key}
                    className={`p-3 rounded-lg border ${colors.border} ${colors.cardBg}`}
                  >
                    <p className={`text-xs ${colors.textMuted} mb-1`}>
                      {key.replace('default-', '').replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    <p className={`text-sm ${colors.textPrimary}`}>
                      {Array.isArray(value) ? (
                        value.length > 0 && typeof value[0] === 'object' ? (
                          <span className="text-xs">Table data ({value.length} rows)</span>
                        ) : (
                          value.join(', ')
                        )
                      ) : (
                        String(value)
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Actions (only for creator) */}
        {isCreator && (
          <div className={`
            relative px-6 py-4 border-t ${colors.modalFooterBorder}
            ${colors.modalFooterBg} flex flex-wrap gap-3
          `}>
            {ticket.status === 'blocked' && hasUnresolvedBlockers && (
              <button
                onClick={handleResolveBlocker}
                disabled={actionLoading}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text} transition-colors disabled:opacity-50`}
              >
                Resolve Blocker
              </button>
            )}
            
            {!['resolved', 'closed'].includes(ticket.status) && (
              <button
                onClick={handleResolveTicket}
                disabled={actionLoading}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} transition-colors disabled:opacity-50`}
              >
                Resolve Ticket
              </button>
            )}
            
            {ticket.status === 'resolved' && (
              <button
                onClick={handleCloseTicket}
                disabled={actionLoading}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r ${cardCharacters.neutral.bg} ${cardCharacters.neutral.text} transition-colors disabled:opacity-50`}
              >
                Close Ticket
              </button>
            )}
            
            {ticket.status === 'closed' && (
              <button
                onClick={handleReopenTicket}
                disabled={actionLoading}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r ${cardCharacters.interactive.bg} ${cardCharacters.interactive.text} transition-colors disabled:opacity-50`}
              >
                Reopen Ticket
              </button>
            )}
            
            <button
              onClick={onClose}
              className={`ml-auto px-6 py-2.5 rounded-lg font-semibold text-sm border-2 ${colors.inputBorder} ${colors.textPrimary} transition-colors`}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}