// ============================================
// app/components/ticketing/TicketDetailModal.tsx
// FIXED: Absolute path handling + workflow attachments
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Loader2, AlertCircle, CheckCircle, Clock, ArrowRight,
  FileText, User, Activity, AlertTriangle,
  Undo2, Paperclip, Download, Image as ImageIcon, File,
  ChevronDown, ChevronUp
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
  const { colors, cardCharacters, getModalStyles, showToast } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockerText, setBlockerText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<number[]>([]);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const toggleHistoryExpansion = (index: number) => {
    setExpandedHistory(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

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

  // ✅ FIX: Convert database paths to API URLs
  const getAttachmentUrl = (attachmentPath: string): string => {
    console.log('🔗 Converting path:', attachmentPath);
    
    // Handle absolute Windows paths (D:\ARDA\uploads\tickets\TKT-XXX\file.pdf)
    if (attachmentPath.match(/^[A-Za-z]:\\/)) {
      // Extract everything after "uploads\tickets\"
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
          performedBy: {
            userId: user._id || user.id || user.userId || user.username,
            name: user.basicDetails?.name || user.displayName || user.username
          },
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
      
      showToast('Action performed successfully!', 'success');
      
      if (['close', 'resolve'].includes(action)) {
        onUpdate();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to perform action', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveBlocker = () => {
    if (window.confirm('Are you sure you want to resolve this blocker?')) {
      performAction('blocker_resolved');
    }
  };

  const handleResolveTicket = () => {
    if (window.confirm('Are you sure you want to resolve this ticket? This will bypass the workflow.')) {
      performAction('resolve', { explanation });
    }
  };

  const handleCloseTicket = () => {
    if (window.confirm('Are you sure you want to close this ticket?')) {
      performAction('close');
    }
  };

  const handleReopenTicket = () => {
    const reason = prompt('Please provide a reason for reopening this ticket:');
    if (reason) {
      performAction('reopen', { explanation: reason });
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
            className={`group relative w-full py-3 rounded-lg font-bold overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} flex items-center justify-center gap-2`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
            ></div>
            <span className="relative z-10">Close</span>
          </button>
        </div>
      </div>
    );
  }

  const isCreator = ticket.raisedBy.userId === userId;
  const hasUnresolvedBlockers = ticket.blockers?.some((b: any) => !b.isResolved) || false;
  const statusCharColors = getStatusColor(ticket.status);
  
  // ✅ Extract form attachments
  const formAttachments = ticket.formData?.['default-attachments'] || [];

  return (
    <div className={getModalStyles()}>
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} aria-hidden="true" />
      
      <div 
        className={`
          relative rounded-2xl border ${colors.modalBorder}
          ${colors.modalBg} ${colors.modalShadow}
          w-full max-w-5xl
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
              className={`group relative p-2 rounded-lg transition-all duration-300 overflow-hidden ${colors.buttonGhost} ${colors.buttonGhostText}`}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 10px ${colors.glowSecondary}` }}
              ></div>
              <X className="w-5 h-5 relative z-10 group-hover:rotate-90 transition-all duration-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`relative p-6 ${colors.modalContentBg} max-h-[calc(90vh-180px)] overflow-y-auto`}>
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${colors.modalContentText}`}>
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <div className={`p-4 rounded-xl border-2 bg-gradient-to-r ${statusCharColors.bg} ${statusCharColors.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold ${statusCharColors.text}`}>Status</h3>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${statusCharColors.bg} ${statusCharColors.text}`}
                  >
                    {ticket.status.toUpperCase().replace('-', ' ')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={colors.textMuted}>Priority</p>
                    <p className={`font-semibold ${statusCharColors.text} capitalize`}>
                      {ticket.priority}
                    </p>
                  </div>
                  <div>
                    <p className={colors.textMuted}>Created</p>
                    <p className={`font-semibold ${statusCharColors.text}`}>
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
                        className={`p-3 rounded-lg ${colors.cardBg} border ${colors.borderSubtle}`}
                        style={{ opacity: blocker.isResolved ? 0.5 : 1 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className={`text-sm ${colors.textPrimary} font-medium`}>
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
                      className={`group relative mt-3 w-full py-2 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-50 overflow-hidden bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text} flex items-center justify-center gap-2`}
                    >
                      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ boxShadow: `inset 0 0 20px ${colors.glowSuccess}` }}
                      ></div>
                      <CheckCircle className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-all duration-300" />
                      <span className="relative z-10">{actionLoading ? 'Resolving...' : 'Resolve Blocker'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Workflow History */}
              <div>
                <h3 className={`font-bold ${colors.textPrimary} mb-4 flex items-center gap-2`}>
                  <Activity className="w-5 h-5" />
                  Workflow History
                </h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {ticket.workflowHistory && ticket.workflowHistory.length > 0 ? (
                    ticket.workflowHistory.map((entry: any, idx: number) => {
                      const isExpanded = expandedHistory.includes(idx);
                      const hasDetails = entry.explanation || entry.attachments?.length > 0 || entry.blockerDescription;
                      const actionColor = getActionColor(entry.actionType);
                      const isRevert = entry.actionType === 'reverted';

                      return (
                        <div 
                          key={idx}
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
                                      onClick={() => toggleHistoryExpansion(idx)}
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
              </div>
            </div>

            {/* Right Column - Form Data */}
            <div className="space-y-4">
              <h3 className={`font-bold ${colors.textPrimary} mb-3`}>Submitted Data</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {Object.entries(ticket.formData).map(([key, value]) => {
                  if (key === 'default-attachments') return null;
                  
                  return (
                    <div 
                      key={key}
                      className={`p-3 rounded-lg border-2 ${colors.border} ${colors.cardBg}`}
                    >
                      <p className={`text-xs font-bold ${colors.textMuted} mb-1 uppercase`}>
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
                  );
                })}
                
                {/* ✅ FIXED: Form Attachments with Absolute Path Handling */}
                {formAttachments.length > 0 && (
                  <div className={`p-3 rounded-lg border-2 ${colors.border} ${colors.cardBg}`}>
                    <p className={`text-xs font-bold ${colors.textMuted} mb-3 uppercase flex items-center gap-1.5`}>
                      <Paperclip className="w-3.5 h-3.5" />
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
                              group relative flex items-center gap-2 p-2.5 rounded-lg border 
                              transition-all duration-300 overflow-hidden text-left
                              ${colors.inputBg} ${colors.inputBorder}
                            `}
                          >
                            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                            
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                              style={{ boxShadow: `inset 0 0 15px ${colors.glowPrimary}` }}
                            ></div>
                            
                            <div className={`relative z-10 p-1.5 rounded bg-gradient-to-r ${charColors.bg} ${charColors.iconColor}`}>
                              {getFileIcon(fileName)}
                            </div>
                            <div className="relative z-10 flex-1 min-w-0">
                              <p className={`text-xs font-medium ${colors.textPrimary} truncate`}>
                                {fileName}
                              </p>
                              <p className={`text-[10px] ${colors.textMuted}`}>
                                Submitted with form
                              </p>
                            </div>
                            <Download className={`relative z-10 w-3.5 h-3.5 ${colors.textMuted} group-hover:${charColors.iconColor} group-hover:translate-x-0.5 transition-all duration-300`} />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {isCreator && (
          <div className={`
            relative px-6 py-4 border-t ${colors.modalFooterBorder}
            ${colors.modalFooterBg} flex flex-wrap gap-3
          `}>
            {ticket.status === 'blocked' && hasUnresolvedBlockers && (
              <button
                onClick={handleResolveBlocker}
                disabled={actionLoading}
                className={`group relative px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-50 overflow-hidden bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text} flex items-center gap-2`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowSuccess}` }}
                ></div>
                <CheckCircle className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-all duration-300" />
                <span className="relative z-10">Resolve Blocker</span>
              </button>
            )}
            
            {!['resolved', 'closed'].includes(ticket.status) && (
              <button
                onClick={handleResolveTicket}
                disabled={actionLoading}
                className={`group relative px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-50 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} flex items-center gap-2`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                ></div>
                <CheckCircle className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-all duration-300" />
                <span className="relative z-10">Resolve Ticket</span>
              </button>
            )}
            
            {ticket.status === 'resolved' && (
              <button
                onClick={handleCloseTicket}
                disabled={actionLoading}
                className={`group relative px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-50 overflow-hidden bg-gradient-to-r ${cardCharacters.neutral.bg} ${cardCharacters.neutral.text} flex items-center gap-2`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
                ></div>
                <X className="w-4 h-4 relative z-10 group-hover:rotate-90 transition-all duration-300" />
                <span className="relative z-10">Close Ticket</span>
              </button>
            )}
            
            {ticket.status === 'closed' && (
              <button
                onClick={handleReopenTicket}
                disabled={actionLoading}
                className={`group relative px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-50 overflow-hidden bg-gradient-to-r ${cardCharacters.interactive.bg} ${cardCharacters.interactive.text} flex items-center gap-2`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                ></div>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-all duration-300" />
                <span className="relative z-10">Reopen Ticket</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className={`group relative ml-auto px-6 py-2.5 rounded-lg font-semibold text-sm border-2 transition-all duration-300 overflow-hidden ${colors.inputBorder} ${colors.textPrimary}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
              ></div>
              <span className="relative z-10">Close</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}