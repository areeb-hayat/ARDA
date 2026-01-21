// ============================================
// app/components/ticketing/TicketDetailsView.tsx
// FINAL: Form attachments + workflow attachments display
// ============================================

'use client';

import React, { useState } from 'react';
import { 
  Info, Clock, User, AlertTriangle, CheckCircle, ArrowRight,
  Undo2, Paperclip, Download, FileText, Image as ImageIcon,
  File, ChevronDown, ChevronUp
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Ticket {
  _id: string;
  ticketNumber: string;
  functionalityName: string;
  status: string;
  workflowStage: string;
  currentAssignee: string;
  currentAssignees: string[];
  raisedBy: {
    name: string;
    userId: string;
  };
  formData?: Record<string, any>;
  workflowHistory: any[];
  blockers: any[];
  createdAt: string;
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
  ticket: Ticket;
  workflowPosition: WorkflowPosition;
}

export default function TicketDetailsView({ ticket, workflowPosition }: Props) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  const [expandedHistory, setExpandedHistory] = useState<number[]>([]);

  const toggleHistoryExpansion = (index: number) => {
    setExpandedHistory(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
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

  // Helper function to convert attachment path to API URL
  const getAttachmentUrl = (attachmentPath: string): string => {
    // Handle absolute paths (old format)
    if (attachmentPath.includes('\\') || attachmentPath.startsWith('D:') || attachmentPath.startsWith('C:')) {
      const uploadsIndex = attachmentPath.indexOf('uploads');
      if (uploadsIndex !== -1) {
        const relativePath = attachmentPath.substring(uploadsIndex).replace(/\\/g, '/');
        return `/api/attachments/${relativePath.replace('uploads/tickets/', '')}`;
      }
      // Fallback: try to extract ticket number and filename
      const parts = attachmentPath.split(/[\\\/]/);
      const ticketIndex = parts.findIndex(p => p.startsWith('TKT-'));
      if (ticketIndex !== -1 && ticketIndex < parts.length - 1) {
        const ticketNumber = parts[ticketIndex];
        const filename = parts[parts.length - 1];
        return `/api/attachments/${ticketNumber}/${filename}`;
      }
      return attachmentPath; // Fallback to original if can't parse
    }
    
    // Handle relative paths (new format)
    return `/api/attachments/${attachmentPath.replace('uploads/tickets/', '')}`;
  };

  // Extract form attachments
  const formAttachments = ticket.formData?.['default-attachments'] || [];

  return (
    <div className="space-y-4">
      {/* Ticket Info */}
      <div 
        className={`relative overflow-hidden p-4 rounded-xl border-2 bg-gradient-to-br ${charColors.bg} ${charColors.border}`}
      >
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        <div className="relative grid grid-cols-2 gap-4">
          <div>
            <p className={`text-xs ${colors.textMuted} mb-1 font-bold`}>Status</p>
            <p className={`font-semibold ${colors.textPrimary}`}>
              {ticket.status.toUpperCase().replace('-', ' ')}
            </p>
          </div>
          <div>
            <p className={`text-xs ${colors.textMuted} mb-1 font-bold`}>Raised By</p>
            <p className={`font-semibold ${colors.textPrimary}`}>
              {ticket.raisedBy.name}
            </p>
          </div>
          <div>
            <p className={`text-xs ${colors.textMuted} mb-1 font-bold`}>Workflow Stage</p>
            <p className={`font-semibold ${colors.textPrimary}`}>
              {workflowPosition.isFirst ? '🟢 First Stage' : workflowPosition.isLast ? '🔴 Final Stage' : '🟡 Middle Stage'}
            </p>
          </div>
          <div>
            <p className={`text-xs ${colors.textMuted} mb-1 font-bold`}>Assignees</p>
            <p className={`font-semibold ${colors.textPrimary}`}>
              {ticket.currentAssignees?.length || 1} {ticket.currentAssignees?.length > 1 ? 'people' : 'person'}
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
                // Handle attachments separately at the end
                if (key === 'default-attachments') return null;
                
                const label = key
                  .replace('default-', '')
                  .replace(/-/g, ' ')
                  .replace(/field-\d+/, 'Custom Field')
                  .replace(/\b\w/g, (l: string) => l.toUpperCase());
                
                let displayValue: React.ReactNode;
                
                if (Array.isArray(value)) {
                  if (value.length === 0) {
                    displayValue = <span className={colors.textMuted}>Not provided</span>;
                  } else if (typeof value[0] === 'object') {
                    // Table data
                    displayValue = (
                      <div className="overflow-x-auto mt-2">
                        <table className={`w-full text-sm border-collapse border-2 ${colors.inputBorder}`}>
                          <thead>
                            <tr className={colors.inputBg}>
                              {Object.keys(value[0]).map((col) => (
                                <th 
                                  key={col}
                                  className={`px-2 py-1 text-left text-xs font-bold ${colors.textPrimary} border ${colors.borderSubtle}`}
                                >
                                  {col.replace(/col\d+/, 'Column').toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {value.map((row: any, idx: number) => (
                              <tr key={idx}>
                                {Object.values(row).map((cell: any, cellIdx: number) => (
                                  <td 
                                    key={cellIdx}
                                    className={`px-2 py-1 text-xs border ${colors.textPrimary} ${colors.borderSubtle}`}
                                  >
                                    {cell || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  } else {
                    displayValue = (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {value.map((item: any, idx: number) => (
                          <span 
                            key={idx}
                            className={`px-2 py-0.5 rounded text-xs font-semibold bg-gradient-to-r ${charColors.bg} ${charColors.text}`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    );
                  }
                } else if (typeof value === 'object' && value !== null) {
                  displayValue = JSON.stringify(value);
                } else if (!value) {
                  displayValue = <span className={colors.textMuted}>Not provided</span>;
                } else {
                  displayValue = String(value);
                }

                return (
                  <div key={key} className={`pb-3 border-b last:border-b-0 ${colors.borderSubtle}`}>
                    <p className={`text-xs font-bold ${colors.textMuted} mb-1 uppercase`}>
                      {label}
                    </p>
                    <div className={`text-sm ${colors.textPrimary}`}>
                      {displayValue}
                    </div>
                  </div>
                );
              })}

              {/* Form Attachments Section */}
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
                          {/* Paper Texture */}
                          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                          
                          {/* Internal Glow */}
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

      {/* Blockers */}
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
                className={`relative overflow-hidden p-3 rounded-lg border-2 ${
                  blocker.isResolved 
                    ? `bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border}`
                    : `bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border}`
                }`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                <div className="relative">
                  <p className={`text-sm ${colors.textPrimary} mb-1 font-medium`}>
                    {blocker.description}
                  </p>
                  <p className={`text-xs ${colors.textMuted}`}>
                    Reported by {blocker.reportedByName} • {new Date(blocker.reportedAt).toLocaleDateString()}
                  </p>
                  {blocker.isResolved && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${cardCharacters.completed.text}`}>
                      <CheckCircle className="w-3 h-3" />
                      Resolved by {blocker.resolvedByName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Workflow History */}
      {ticket.workflowHistory && ticket.workflowHistory.length > 0 && (
        <div>
          <h3 className={`font-bold ${colors.textPrimary} mb-3 flex items-center gap-2`}>
            <Clock className={`w-5 h-5 ${charColors.iconColor}`} />
            Workflow History
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {ticket.workflowHistory.slice().reverse().map((entry: any, index: number) => {
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
                      : `${colors.inputBg} ${colors.inputBorder}`
                  }`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                  
                  {/* Main Content */}
                  <div className="relative p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${actionColor.bg} ${actionColor.iconColor} flex-shrink-0`}>
                        {getActionIcon(entry.actionType)}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        {/* Action Type */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <p className={`font-bold ${isRevert ? cardCharacters.interactive.text : colors.textPrimary} text-base`}>
                              {entry.actionType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </p>
                            <p className={`text-xs ${colors.textMuted} mt-0.5 flex items-center gap-1`}>
                              <User className="w-3 h-3" />
                              {entry.performedBy?.name} • {new Date(entry.performedAt).toLocaleString()}
                            </p>
                          </div>
                          
                          {/* Expand Button */}
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

                        {/* Quick Preview */}
                        {!isExpanded && (entry.explanation || entry.blockerDescription) && (
                          <p className={`text-xs ${colors.textSecondary} italic line-clamp-2 mt-2`}>
                            {entry.explanation || entry.blockerDescription}
                          </p>
                        )}
                        
                        {/* Attachment Count Preview */}
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
                      <div className={`mt-4 pt-4 border-t ${colors.borderSubtle} space-y-3`}>
                        {/* Message/Explanation */}
                        {(entry.explanation || entry.blockerDescription) && (
                          <div 
                            className={`p-3 rounded-lg border ${
                              isRevert 
                                ? `${cardCharacters.interactive.border} bg-gradient-to-r ${cardCharacters.interactive.bg}`
                                : `${colors.borderSubtle} ${colors.cardBg}`
                            }`}
                          >
                            <p className={`text-xs font-bold ${colors.textMuted} mb-1 uppercase flex items-center gap-1.5`}>
                              <FileText className="w-3.5 h-3.5" />
                              {isRevert ? 'Revert Message' : entry.blockerDescription ? 'Blocker Description' : 'Explanation'}
                            </p>
                            <p className={`text-sm ${isRevert ? cardCharacters.interactive.text : colors.textPrimary} leading-relaxed`}>
                              {entry.explanation || entry.blockerDescription}
                            </p>
                          </div>
                        )}

                        {/* Attachments */}
                        {entry.attachments && entry.attachments.length > 0 && (
                          <div>
                            <p className={`text-xs font-bold ${colors.textMuted} mb-2 uppercase flex items-center gap-1.5`}>
                              <Paperclip className="w-3.5 h-3.5" />
                              Attachments ({entry.attachments.length})
                            </p>
                            <div className="space-y-2">
                              {entry.attachments.map((attachment: string, idx: number) => {
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
                                    {/* Paper Texture */}
                                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                                    
                                    {/* Internal Glow */}
                                    <div 
                                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                      style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                                    ></div>
                                    
                                    <div className={`relative z-10 p-2 rounded ${actionColor.bg} ${actionColor.iconColor}`}>
                                      {getFileIcon(fileName)}
                                    </div>
                                    <div className="relative z-10 flex-1 min-w-0">
                                      <p className={`text-sm font-medium ${colors.textPrimary} truncate`}>
                                        {fileName}
                                      </p>
                                      <p className={`text-xs ${colors.textMuted}`}>
                                        Click to download
                                      </p>
                                    </div>
                                    <Download className={`relative z-10 w-4 h-4 ${colors.textMuted} group-hover:${actionColor.iconColor} group-hover:translate-x-1 transition-all duration-300`} />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Group Members */}
                        {entry.groupMembers && entry.groupMembers.length > 0 && (
                          <div>
                            <p className={`text-xs font-bold ${colors.textMuted} mb-2 uppercase`}>
                              Group Members ({entry.groupMembers.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {entry.groupMembers.map((member: any, idx: number) => (
                                <span
                                  key={idx}
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
            })}
          </div>
        </div>
      )}
    </div>
  );
}