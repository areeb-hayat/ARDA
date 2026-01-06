// app/components/ProjectManagement/depthead/DeliverableCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Paperclip,
  UserPlus,
  UserMinus,
  X
} from 'lucide-react';

interface DeliverableCardProps {
  deliverable: any;
  projectId: string;
  userId: string;
  userName: string;
  department: string;
  onUpdate: () => void;
}

export default function DeliverableCard({
  deliverable,
  projectId,
  userId,
  userName,
  department,
  onUpdate
}: DeliverableCardProps) {
  const { colors, cardCharacters, showToast } = useTheme();
  
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'pending': return cardCharacters.neutral;
      case 'in-progress': return cardCharacters.interactive;
      case 'in-review': return cardCharacters.informative;
      case 'done': return cardCharacters.completed;
      default: return cardCharacters.neutral;
    }
  };

  const statusColors = getStatusColors(deliverable.status);
  const unresolvedBlockers = deliverable.blockers?.filter((b: any) => !b.isResolved) || [];
  const isOverdue = deliverable.dueDate && new Date(deliverable.dueDate) < new Date() && deliverable.status !== 'done';

  useEffect(() => {
    if (showMemberManager && availableMembers.length === 0) {
      fetchAvailableMembers();
    }
  }, [showMemberManager]);

  const fetchAvailableMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await fetch(`/api/dept-employees?department=${encodeURIComponent(department)}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableMembers(data.employees || []);
      }
    } catch (error) {
      showToast('Failed to fetch employees', 'error');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ProjectManagement/depthead/deliverables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          deliverableId: deliverable._id,
          action: 'change-status',
          newStatus,
          userId,
          userName
        })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      showToast('Status updated successfully', 'success');
      // Stay on page - no redirect
    } catch (error: any) {
      showToast(error.message || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('/api/ProjectManagement/depthead/deliverables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          deliverableId: deliverable._id,
          action: 'add-comment',
          message: commentText,
          userId,
          userName
        })
      });

      if (!response.ok) throw new Error('Failed to add comment');
      
      showToast('Comment added', 'success');
      setCommentText('');
      // Stay on page - no redirect
    } catch (error: any) {
      showToast(error.message || 'Failed to add comment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveBlocker = async (blockerIndex: number) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ProjectManagement/depthead/deliverables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          deliverableId: deliverable._id,
          action: 'resolve-blocker',
          blockerIndex,
          userId,
          userName
        })
      });

      if (!response.ok) throw new Error('Failed to resolve blocker');
      
      showToast('Blocker resolved', 'success');
      // Stay on page - no redirect
    } catch (error: any) {
      showToast(error.message || 'Failed to resolve blocker', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMember = async (memberId: string) => {
    const isAssigned = deliverable.assignedTo?.some((id: string) => id === memberId);
    
    try {
      setLoading(true);
      const response = await fetch('/api/ProjectManagement/depthead/deliverables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          deliverableId: deliverable._id,
          action: isAssigned ? 'remove-member' : 'add-member',
          memberId,
          userId,
          userName
        })
      });

      if (!response.ok) throw new Error('Failed to update team');
      
      showToast(isAssigned ? 'Member removed' : 'Member added', 'success');
      // Stay on page - no redirect
    } catch (error: any) {
      showToast(error.message || 'Failed to update team', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${statusColors.bg} ${statusColors.border} ${colors.shadowCard} hover:${colors.shadowHover} transition-all`}>
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

      {/* Header */}
      <div
        className="relative p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-base font-black ${statusColors.text}`}>
                {deliverable.title}
              </h4>
              <div className={`px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${statusColors.bg}`}>
                {deliverable.status.toUpperCase().replace('-', ' ')}
              </div>
              {unresolvedBlockers.length > 0 && (
                <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.urgent.bg}`}>
                  <AlertTriangle className={`w-3 h-3 ${cardCharacters.urgent.iconColor}`} />
                  {unresolvedBlockers.length}
                </div>
              )}
              {isOverdue && (
                <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.urgent.bg}`}>
                  <Clock className={`w-3 h-3 ${cardCharacters.urgent.iconColor}`} />
                  OVERDUE
                </div>
              )}
            </div>
            
            <p className={`text-sm ${colors.textSecondary} ${!expanded && 'line-clamp-2'}`}>
              {deliverable.description}
            </p>
            
            <div className={`flex items-center gap-3 text-xs ${colors.textMuted} flex-wrap`}>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{deliverable.assignedTo?.length || 0} assigned</span>
              </div>
              {deliverable.dueDate && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due {new Date(deliverable.dueDate).toLocaleDateString()}</span>
                  </div>
                </>
              )}
              {deliverable.comments?.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{deliverable.comments.length} comments</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <button className={`p-2 rounded-lg transition-all ${colors.inputBg} hover:${colors.cardBgHover}`}>
            {expanded ? (
              <ChevronUp className={`w-5 h-5 ${colors.textMuted}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${colors.textMuted}`} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className={`relative border-t ${statusColors.border} p-4 space-y-4`} onClick={(e) => e.stopPropagation()}>
          
          {/* Submission Note */}
          {deliverable.submissionNote && (
            <div className={`p-3 rounded-lg bg-gradient-to-r ${cardCharacters.informative.bg} border ${cardCharacters.informative.border}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <h5 className={`text-xs font-bold ${colors.textMuted} mb-2 relative z-10`}>SUBMISSION NOTE</h5>
              <p className={`text-sm ${colors.textPrimary} mb-2 relative z-10`}>{deliverable.submissionNote}</p>
              {deliverable.submittedAt && (
                <p className={`text-xs ${colors.textMuted} relative z-10`}>
                  Submitted by {deliverable.submittedBy || 'Unknown'} on {new Date(deliverable.submittedAt).toLocaleString()}
                </p>
              )}
              {deliverable.submissionAttachments && deliverable.submissionAttachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 relative z-10">
                  {deliverable.submissionAttachments.map((attachment: string, i: number) => (
                    <a
                      key={i}
                      href={`/api/download?path=${encodeURIComponent(attachment)}`}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.inputBg} border ${colors.inputBorder} hover:${colors.cardBgHover} transition-all cursor-pointer`}
                    >
                      <Paperclip className={`w-3 h-3 ${colors.textMuted}`} />
                      <span className={`text-xs ${colors.textSecondary}`}>
                        {attachment.split('/').pop()?.split('_').slice(1).join('_') || 'Download'}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status Change Buttons */}
          <div>
            <h5 className={`text-xs font-bold ${colors.textMuted} mb-2`}>CHANGE STATUS</h5>
            <div className="flex flex-wrap gap-2">
              {deliverable.status !== 'in-progress' && (
                <button
                  onClick={() => handleStatusChange('in-progress')}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.interactive.bg} ${cardCharacters.interactive.text} disabled:opacity-50 hover:scale-105 transition-all`}
                >
                  <Clock className="w-3 h-3" />
                  IN PROGRESS
                </button>
              )}
              
              {deliverable.status !== 'in-review' && (
                <button
                  onClick={() => handleStatusChange('in-review')}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.informative.bg} ${cardCharacters.informative.text} disabled:opacity-50 hover:scale-105 transition-all`}
                >
                  <MessageSquare className="w-3 h-3" />
                  IN REVIEW
                </button>
              )}
              
              {deliverable.status !== 'done' && (
                <button
                  onClick={() => handleStatusChange('done')}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text} disabled:opacity-50 hover:scale-105 transition-all`}
                >
                  <CheckCircle className="w-3 h-3" />
                  DONE
                </button>
              )}
              
              {deliverable.status === 'done' && (
                <button
                  onClick={() => handleStatusChange('in-progress')}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.neutral.bg} ${cardCharacters.neutral.text} disabled:opacity-50 hover:scale-105 transition-all`}
                >
                  <XCircle className="w-3 h-3" />
                  REOPEN
                </button>
              )}
            </div>
          </div>

          {/* Team Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className={`text-xs font-bold ${colors.textMuted}`}>MANAGE TEAM</h5>
              <button
                onClick={() => setShowMemberManager(!showMemberManager)}
                disabled={loading}
                className={`text-xs font-bold ${cardCharacters.interactive.text} hover:underline flex items-center gap-1`}
              >
                <UserPlus className="w-3 h-3" />
                {showMemberManager ? 'Close' : 'Add/Remove Members'}
              </button>
            </div>
            
            {showMemberManager && (
              <div className={`p-3 rounded-lg ${colors.inputBg} border ${colors.inputBorder} space-y-2`}>
                {loadingMembers ? (
                  <p className={`text-sm ${colors.textMuted}`}>Loading employees...</p>
                ) : availableMembers.length === 0 ? (
                  <p className={`text-sm ${colors.textMuted}`}>No employees found in {department}</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {availableMembers.map((member) => {
                      const isAssigned = deliverable.assignedTo?.some((id: string) => id === member._id || id === member.email);
                      
                      return (
                        <div
                          key={member._id}
                          className={`flex items-center justify-between p-2 rounded-lg ${colors.cardBg} border ${colors.borderSubtle}`}
                        >
                          <div>
                            <p className={`text-sm font-bold ${colors.textPrimary}`}>
                              {member.username}
                            </p>
                            <p className={`text-xs ${colors.textMuted}`}>
                              {member.email}
                            </p>
                          </div>
                          <button
                            onClick={() => handleToggleMember(member._id)}
                            disabled={loading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:scale-105 ${
                              isAssigned
                                ? `bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}`
                                : `bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text}`
                            } disabled:opacity-50`}
                          >
                            {isAssigned ? (
                              <>
                                <UserMinus className="w-3 h-3" />
                                Remove
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" />
                                Add
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Blockers */}
          {unresolvedBlockers.length > 0 && (
            <div>
              <h5 className={`text-xs font-bold ${colors.textMuted} mb-2`}>BLOCKERS</h5>
              <div className="space-y-2">
                {deliverable.blockers?.map((blocker: any, index: number) => {
                  if (blocker.isResolved) return null;
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg bg-gradient-to-r ${cardCharacters.urgent.bg} border ${cardCharacters.urgent.border}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className={`text-sm ${colors.textPrimary} flex-1`}>
                          {blocker.description}
                        </p>
                        <button
                          onClick={() => handleResolveBlocker(index)}
                          disabled={loading}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text} disabled:opacity-50 hover:scale-105 transition-all whitespace-nowrap`}
                        >
                          Resolve
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${colors.textMuted}`}>
                          Reported by {blocker.reportedBy}
                        </span>
                        <span className={`text-xs ${colors.textMuted}`}>
                          {new Date(blocker.reportedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {blocker.attachments && blocker.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {blocker.attachments.map((attachment: string, i: number) => (
                            <a
                              key={i}
                              href={`/api/download?path=${encodeURIComponent(attachment)}`}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 px-2 py-1 rounded-lg ${colors.inputBg} border ${colors.inputBorder} hover:${colors.cardBgHover} transition-all cursor-pointer`}
                            >
                              <Paperclip className={`w-3 h-3 ${colors.textMuted}`} />
                              <span className={`text-xs ${colors.textSecondary}`}>
                                {attachment.split('/').pop()?.split('_').slice(1).join('_') || 'Download'}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attachments */}
          {deliverable.attachments && deliverable.attachments.length > 0 && (
            <div>
              <h5 className={`text-xs font-bold ${colors.textMuted} mb-2`}>ATTACHMENTS</h5>
              <div className="flex flex-wrap gap-2">
                {deliverable.attachments.map((attachment: string, index: number) => (
                  <a
                    key={index}
                    href={`/api/download?path=${encodeURIComponent(attachment)}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.inputBg} border ${colors.inputBorder} hover:${colors.cardBgHover} transition-all cursor-pointer`}
                  >
                    <Paperclip className={`w-3.5 h-3.5 ${colors.textMuted}`} />
                    <span className={`text-xs ${colors.textSecondary}`}>
                      {attachment.split('/').pop()?.split('_').slice(1).join('_') || 'Download'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className={`w-4 h-4 ${colors.textMuted}`} />
              <h5 className={`text-xs font-bold ${colors.textMuted}`}>
                COMMENTS ({deliverable.comments?.length || 0})
              </h5>
            </div>
            
            <div className="space-y-3 mb-3">
              {deliverable.comments?.slice(-3).map((comment: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg ${colors.inputBg} border ${colors.inputBorder}`}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm font-bold ${colors.textPrimary}`}>
                      {comment.userName}
                    </span>
                    <span className={`text-xs ${colors.textMuted}`}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm ${colors.textSecondary}`}>{comment.message}</p>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                disabled={loading}
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} disabled:opacity-50`}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || loading}
                className={`group relative p-2 rounded-lg ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50 overflow-hidden`}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                ></div>
                <Send className="w-4 h-4 relative z-10" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}