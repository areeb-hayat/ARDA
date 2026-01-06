// app/components/ProjectManagement/employee/EmployeeDeliverableCard.tsx
'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Clock,
  Send,
  PlayCircle,
  CheckCircle
} from 'lucide-react';

interface EmployeeDeliverableCardProps {
  deliverable: any;
  projectId: string;
  userId: string;
  userName: string;
  isLead: boolean;
  onUpdate: () => void;
}

export default function EmployeeDeliverableCard({
  deliverable,
  projectId,
  userId,
  userName,
  isLead,
  onUpdate
}: EmployeeDeliverableCardProps) {
  const { colors, cardCharacters, showToast } = useTheme();
  
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [blockerText, setBlockerText] = useState('');
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleAction = async (actionType: string, data?: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ProjectManagement/employee/deliverables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          deliverableId: deliverable._id,
          action: actionType,
          userId,
          userName,
          ...data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update');
      }
      
      showToast(`Deliverable updated successfully`, 'success');
      onUpdate();
    } catch (error: any) {
      showToast(error.message || 'Failed to update deliverable', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = () => handleAction('start-work');
  const handleSubmitForReview = () => handleAction('submit-for-review');
  
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await handleAction('add-comment', { message: commentText });
    setCommentText('');
  };

  const handleReportBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockerText.trim()) return;
    await handleAction('report-blocker', { description: blockerText });
    setBlockerText('');
    setShowBlockerForm(false);
  };

  const handleUpdateDeadline = async () => {
    if (!newDueDate) return;
    await handleAction('update-deadline', { newDueDate });
    setShowDatePicker(false);
    setNewDueDate('');
  };

  const unresolvedBlockers = deliverable.blockers?.filter((b: any) => !b.isResolved) || [];
  const canStartWork = deliverable.status === 'pending';
  const canSubmit = deliverable.status === 'in-progress';

  return (
    <div className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.neutral.bg} ${cardCharacters.neutral.border} ${colors.shadowCard}`}>
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

      {/* Header */}
      <div
        className="relative p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-base font-black ${colors.textPrimary}`}>
                {deliverable.title}
              </h4>
              <div className={`px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${statusColors.bg} ${statusColors.text}`}>
                {deliverable.status.toUpperCase().replace('-', ' ')}
              </div>
              {unresolvedBlockers.length > 0 && (
                <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}`}>
                  <AlertTriangle className="w-3 h-3" />
                  {unresolvedBlockers.length} Blocker{unresolvedBlockers.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            <p className={`text-sm ${colors.textSecondary} ${!expanded && 'line-clamp-2'}`}>
              {deliverable.description}
            </p>
            
            <div className={`flex items-center gap-3 text-xs ${colors.textMuted}`}>
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
            </div>
          </div>
          
          <button className={`p-2 rounded-lg transition-all ${colors.cardBg}`}>
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
        <div className="relative border-t ${colors.border} p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
          {/* Action Buttons */}
          <div>
            <h5 className={`text-xs font-bold ${colors.textMuted} mb-2`}>ACTIONS</h5>
            <div className="flex flex-wrap gap-2">
              {canStartWork && (
                <button
                  onClick={handleStartWork}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.interactive.bg} ${cardCharacters.interactive.text} disabled:opacity-50`}
                >
                  <PlayCircle className="w-3 h-3" />
                  START WORK
                </button>
              )}
              
              {canSubmit && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.informative.bg} ${cardCharacters.informative.text} disabled:opacity-50`}
                >
                  <CheckCircle className="w-3 h-3" />
                  SUBMIT FOR REVIEW
                </button>
              )}
              
              {!showBlockerForm && (
                <button
                  onClick={() => setShowBlockerForm(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border-2 ${cardCharacters.urgent.border} ${cardCharacters.urgent.text}`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  REPORT BLOCKER
                </button>
              )}
            </div>
          </div>

          {/* Deadline Management (Lead Only) */}
          {isLead && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className={`text-xs font-bold ${colors.textMuted}`}>DEADLINE (LEAD ONLY)</h5>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`text-xs font-bold ${cardCharacters.interactive.text}`}
                >
                  {deliverable.dueDate ? 'Update' : 'Set Deadline'}
                </button>
              </div>
              
              {showDatePicker && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
                  />
                  <button
                    onClick={handleUpdateDeadline}
                    disabled={!newDueDate || loading}
                    className={`px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50`}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Blockers */}
          {(unresolvedBlockers.length > 0 || showBlockerForm) && (
            <div>
              <h5 className={`text-xs font-bold ${colors.textMuted} mb-2`}>BLOCKERS</h5>
              
              <div className="space-y-2">
                {deliverable.blockers?.map((blocker: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      blocker.isResolved
                        ? `${colors.cardBg} opacity-60`
                        : `bg-gradient-to-r ${cardCharacters.urgent.bg}`
                    }`}
                  >
                    <p className={`text-sm ${colors.textPrimary} mb-2`}>
                      {blocker.description}
                    </p>
                    <span className={`text-xs ${colors.textMuted}`}>
                      {blocker.reportedBy} • {new Date(blocker.reportedAt).toLocaleDateString()}
                      {blocker.isResolved && ` • Resolved by ${blocker.resolvedBy}`}
                    </span>
                  </div>
                ))}
                
                {showBlockerForm && (
                  <form onSubmit={handleReportBlocker} className="flex gap-2">
                    <input
                      value={blockerText}
                      onChange={(e) => setBlockerText(e.target.value)}
                      placeholder="Describe the blocker..."
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!blockerText.trim() || loading}
                      className={`px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text} disabled:opacity-50`}
                    >
                      Report
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBlockerForm(false);
                        setBlockerText('');
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold ${colors.buttonSecondary} ${colors.buttonSecondaryText}`}
                    >
                      Cancel
                    </button>
                  </form>
                )}
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
              {deliverable.comments?.map((comment: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg ${colors.cardBg}`}>
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
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || loading}
                className={`p-2 rounded-lg ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}