// app/components/ProjectManagement/employee/EmployeeTaskCard.tsx
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
  PlayCircle,
  CheckCircle,
  Clock,
  Send,
  Paperclip,
  Upload,
  X
} from 'lucide-react';

interface EmployeeTaskCardProps {
  task: any;
  parentId: string;
  userId: string;
  userName: string;
  isLead: boolean;
  type: 'deliverable' | 'action';
  onUpdate: () => void;
}

export default function EmployeeTaskCard({
  task,
  parentId,
  userId,
  userName,
  isLead,
  type,
  onUpdate
}: EmployeeTaskCardProps) {
  const { colors, cardCharacters, showToast } = useTheme();
  
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [blockerText, setBlockerText] = useState('');
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Submission modal state
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  
  // Blocker modal state  
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [blockerDescription, setBlockerDescription] = useState('');
  const [blockerFiles, setBlockerFiles] = useState<File[]>([]);

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'pending': return cardCharacters.neutral;
      case 'in-progress': return cardCharacters.interactive;
      case 'in-review': return cardCharacters.informative;
      case 'done': return cardCharacters.completed;
      default: return cardCharacters.neutral;
    }
  };

  const statusColors = getStatusColors(task.status);
  const endpoint = type === 'deliverable' 
    ? '/api/ProjectManagement/employee/deliverables'
    : '/api/ProjectManagement/employee/actions';
  const idField = type === 'deliverable' ? 'deliverableId' : 'actionId';
  const parentIdField = type === 'deliverable' ? 'projectId' : 'sprintId';

  const handleAction = async (actionType: string, data?: any) => {
    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [parentIdField]: parentId,
          [idField]: task._id,
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
      
      showToast(`${type === 'deliverable' ? 'Deliverable' : 'Action'} updated`, 'success');
      // Stay on page - no redirect
    } catch (error: any) {
      showToast(error.message || `Failed to update ${type}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = () => handleAction('start-work');

  const handleSubmitForReview = async () => {
    if (!submissionNote.trim()) {
      showToast('Please provide a submission note', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Convert files to base64
      const filePromises = submissionFiles.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            name: file.name,
            data: reader.result?.toString().split(',')[1] || '',
            type: file.type
          });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
      
      const filesData = await Promise.all(filePromises);
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [parentIdField]: parentId,
          [idField]: task._id,
          action: 'submit-for-review',
          submissionNote,
          files: filesData,
          userId,
          userName
        })
      });

      if (!response.ok) throw new Error('Failed to submit for review');
      
      showToast('Submitted for review', 'success');
      setShowSubmissionModal(false);
      setSubmissionNote('');
      setSubmissionFiles([]);
      // Stay on page - no redirect
    } catch (error: any) {
      showToast(error.message || 'Failed to submit', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReportBlocker = async () => {
    if (!blockerDescription.trim()) {
      showToast('Please describe the blocker', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Convert files to base64
      const filePromises = blockerFiles.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            name: file.name,
            data: reader.result?.toString().split(',')[1] || '',
            type: file.type
          });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
      
      const filesData = await Promise.all(filePromises);
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [parentIdField]: parentId,
          [idField]: task._id,
          action: 'report-blocker',
          description: blockerDescription,
          files: filesData,
          userId,
          userName
        })
      });

      if (!response.ok) throw new Error('Failed to report blocker');
      
      showToast('Blocker reported', 'success');
      setShowBlockerModal(false);
      setBlockerDescription('');
      setBlockerFiles([]);
      // Stay on page - no redirect
    } catch (error: any) {
      showToast(error.message || 'Failed to report blocker', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await handleAction('add-comment', { message: commentText });
    setCommentText('');
  };

  const handleUpdateDeadline = async () => {
    if (!newDueDate) return;
    await handleAction('update-deadline', { newDueDate });
    setShowDatePicker(false);
    setNewDueDate('');
  };

  const unresolvedBlockers = task.blockers?.filter((b: any) => !b.isResolved) || [];
  const canStartWork = task.status === 'pending';
  const canSubmit = task.status === 'in-progress';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <>
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
                  {task.title}
                </h4>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${statusColors.bg}`}>
                  {task.status.toUpperCase().replace('-', ' ')}
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
                {task.description}
              </p>
              
              <div className={`flex items-center gap-3 text-xs ${colors.textMuted} flex-wrap`}>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{task.assignedTo?.length || 0} assigned</span>
                </div>
                {task.dueDate && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
                {task.comments?.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{task.comments.length} comments</span>
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
            
            {/* Submission Note (if exists) */}
            {task.submissionNote && (
              <div className={`p-3 rounded-lg bg-gradient-to-r ${cardCharacters.informative.bg} border ${cardCharacters.informative.border}`}>
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <h5 className={`text-xs font-bold ${colors.textMuted} mb-2 relative z-10`}>YOUR SUBMISSION</h5>
                <p className={`text-sm ${colors.textPrimary} mb-2 relative z-10`}>{task.submissionNote}</p>
                {task.submittedAt && (
                  <p className={`text-xs ${colors.textMuted} relative z-10`}>
                    Submitted on {new Date(task.submittedAt).toLocaleString()}
                  </p>
                )}
                {task.submissionAttachments && task.submissionAttachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 relative z-10">
                    {task.submissionAttachments.map((attachment: string, i: number) => (
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

            {/* Action Buttons */}
            <div>
              <h5 className={`text-xs font-bold ${colors.textMuted} mb-2`}>ACTIONS</h5>
              <div className="flex flex-wrap gap-2">
                {canStartWork && (
                  <button
                    onClick={handleStartWork}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.interactive.bg} ${cardCharacters.interactive.text} disabled:opacity-50 hover:scale-105 transition-all`}
                  >
                    <PlayCircle className="w-3 h-3" />
                    START WORK
                  </button>
                )}
                
                {canSubmit && (
                  <button
                    onClick={() => setShowSubmissionModal(true)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-gradient-to-r ${cardCharacters.informative.bg} ${cardCharacters.informative.text} disabled:opacity-50 hover:scale-105 transition-all`}
                  >
                    <CheckCircle className="w-3 h-3" />
                    SUBMIT FOR REVIEW
                  </button>
                )}
                
                <button
                  onClick={() => setShowBlockerModal(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border-2 ${cardCharacters.urgent.border} ${cardCharacters.urgent.text} hover:scale-105 transition-all`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  REPORT BLOCKER
                </button>
              </div>
            </div>

            {/* Deadline Management (Lead Only) */}
            {isLead && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`text-xs font-bold ${colors.textMuted}`}>DEADLINE (LEAD ONLY)</h5>
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className={`text-xs font-bold ${cardCharacters.interactive.text} hover:underline`}
                  >
                    {task.dueDate ? 'Update' : 'Set Deadline'}
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
                      className={`px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50 hover:scale-105 transition-all`}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Blockers */}
            {unresolvedBlockers.length > 0 && (
              <div>
                <h5 className={`text-xs font-bold ${colors.textMuted} mb-2`}>BLOCKERS</h5>
                <div className="space-y-2">
                  {task.blockers?.map((blocker: any, index: number) => {
                    if (blocker.isResolved) return null;
                    
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg bg-gradient-to-r ${cardCharacters.urgent.bg} border ${cardCharacters.urgent.border}`}
                      >
                        <p className={`text-sm ${colors.textPrimary} mb-1`}>
                          {blocker.description}
                        </p>
                        <span className={`text-xs ${colors.textMuted}`}>
                          {blocker.reportedBy} • {new Date(blocker.reportedAt).toLocaleDateString()}
                        </span>
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
            {task.attachments && task.attachments.length > 0 && (
              <div>
                <h5 className={`text-xs font-bold ${colors.textMuted} mb-2`}>ATTACHMENTS</h5>
                <div className="flex flex-wrap gap-2">
                  {task.attachments.map((attachment: string, index: number) => (
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
                  COMMENTS ({task.comments?.length || 0})
                </h5>
              </div>
              
              <div className="space-y-3 mb-3">
                {task.comments?.slice(-3).map((comment: any, index: number) => (
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

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: colors.background }}
          onClick={() => setShowSubmissionModal(false)}
        >
          <div
            className={`relative w-full max-w-2xl rounded-xl border backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.border} ${colors.shadowCard} p-6`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03] rounded-xl`}></div>
            
            <div className="relative space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-black ${colors.textPrimary}`}>
                  Submit for Review
                </h3>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className={`p-2 rounded-lg ${colors.inputBg} hover:${colors.cardBgHover}`}
                >
                  <X className={`w-5 h-5 ${colors.textMuted}`} />
                </button>
              </div>

              <div>
                <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                  Submission Note <span className={colors.textMuted}>(Required)</span>
                </label>
                <textarea
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="Describe what you've completed, any notes for the reviewer..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                  Attachments <span className={`text-xs ${colors.textMuted}`}>(Optional)</span>
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setSubmissionFiles(Array.from(e.target.files || []))}
                  className={`w-full px-4 py-3 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
                />
                {submissionFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {submissionFiles.map((file, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.inputBg} border ${colors.inputBorder}`}
                      >
                        <Paperclip className={`w-3 h-3 ${colors.textMuted}`} />
                        <span className={`text-xs ${colors.textSecondary}`}>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitForReview}
                  disabled={!submissionNote.trim() || loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50 hover:scale-105 transition-all flex items-center justify-center gap-2`}
                >
                  {loading ? 'Submitting...' : 'Submit for Review'}
                </button>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className={`px-6 py-3 rounded-lg font-bold text-sm ${colors.buttonSecondary} ${colors.buttonSecondaryText} hover:scale-105 transition-all`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blocker Modal */}
      {showBlockerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: colors.background }}
          onClick={() => setShowBlockerModal(false)}
        >
          <div
            className={`relative w-full max-w-2xl rounded-xl border backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.border} ${colors.shadowCard} p-6`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03] rounded-xl`}></div>
            
            <div className="relative space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-black ${colors.textPrimary}`}>
                  Report Blocker
                </h3>
                <button
                  onClick={() => setShowBlockerModal(false)}
                  className={`p-2 rounded-lg ${colors.inputBg} hover:${colors.cardBgHover}`}
                >
                  <X className={`w-5 h-5 ${colors.textMuted}`} />
                </button>
              </div>

              <div>
                <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                  Blocker Description <span className={colors.textMuted}>(Required)</span>
                </label>
                <textarea
                  value={blockerDescription}
                  onChange={(e) => setBlockerDescription(e.target.value)}
                  placeholder="Describe what's blocking you from completing this task..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                  Supporting Files <span className={`text-xs ${colors.textMuted}`}>(Optional)</span>
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setBlockerFiles(Array.from(e.target.files || []))}
                  className={`w-full px-4 py-3 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
                />
                {blockerFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {blockerFiles.map((file, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.inputBg} border ${colors.inputBorder}`}
                      >
                        <Paperclip className={`w-3 h-3 ${colors.textMuted}`} />
                        <span className={`text-xs ${colors.textSecondary}`}>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleReportBlocker}
                  disabled={!blockerDescription.trim() || loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text} disabled:opacity-50 hover:scale-105 transition-all flex items-center justify-center gap-2`}
                >
                  {loading ? 'Reporting...' : 'Report Blocker'}
                </button>
                <button
                  onClick={() => setShowBlockerModal(false)}
                  className={`px-6 py-3 rounded-lg font-bold text-sm ${colors.buttonSecondary} ${colors.buttonSecondaryText} hover:scale-105 transition-all`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}