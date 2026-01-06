// app/components/ProjectManagement/depthead/CreateDeliverableModal.tsx
'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { X, Package, Loader2, CheckCircle, Paperclip, Trash2 } from 'lucide-react';

interface Member {
  userId: string;
  name: string;
  role: string;
  leftAt?: Date;
}

interface CreateDeliverableModalProps {
  project: any;
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDeliverableModal({
  project,
  userId,
  userName,
  onClose,
  onSuccess
}: CreateDeliverableModalProps) {
  const { colors, cardCharacters, showToast, getModalStyles } = useTheme();
  const charColors = cardCharacters.authoritative;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Array<{ name: string; data: string; type: string }>>([]);
  const [loading, setLoading] = useState(false);

  const activeMembers = project.members?.filter((m: Member) => !m.leftAt) || [];

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          name: file.name,
          data: reader.result as string,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || selectedMembers.length === 0) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/ProjectManagement/depthead/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project._id,
          title,
          description,
          assignedTo: selectedMembers,
          dueDate: dueDate || undefined,
          userId,
          userName,
          attachments: attachments.map(a => ({
            name: a.name,
            data: a.data.split(',')[1],
            type: a.type
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create deliverable');
      }

      showToast('Deliverable created successfully!', 'success');
      onSuccess();
    } catch (error) {
      showToast('Failed to create deliverable', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={getModalStyles()}>
      {/* Backdrop click to close */}
      <div 
        className="absolute inset-0 modal-backdrop" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div 
        className={`
          relative rounded-2xl border ${colors.modalBorder}
          ${colors.modalBg} ${colors.modalShadow}
          w-full max-w-2xl
          modal-content
        `}
        style={{ overflow: 'hidden' }}
      >
        {/* Paper Texture Overlay */}
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03] pointer-events-none`}></div>

        {/* Modal Header */}
        <div className={`
          relative px-6 py-4 border-b ${colors.modalFooterBorder}
          ${colors.modalHeaderBg}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg}`}>
                <Package className={`h-5 w-5 ${charColors.iconColor}`} />
              </div>
              <div>
                <h2 className={`text-xl font-black ${colors.modalHeaderText}`}>
                  Create Deliverable
                </h2>
                <p className={`text-xs ${colors.textMuted}`}>
                  Add a new deliverable to {project.projectNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`group relative p-2 rounded-lg transition-all duration-300 ${colors.buttonGhost} ${colors.buttonGhostText}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className={`relative p-6 ${colors.modalContentBg} max-h-[calc(90vh-180px)] overflow-y-auto`}>
          <form onSubmit={handleSubmit} className={`space-y-6 ${colors.modalContentText}`}>
            {/* Title */}
            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Deliverable Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter deliverable title"
                className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what needs to be delivered"
                rows={4}
                className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} resize-none`}
                required
              />
            </div>

            {/* Due Date */}
            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
              />
            </div>

            {/* Assign to Members */}
            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Assign to Members * (Select at least one)
              </label>
              
              <div className={`rounded-lg border ${colors.border} overflow-hidden`}>
                <div className="max-h-48 overflow-y-auto">
                  {activeMembers.map((member: Member) => (
                    <div
                      key={member.userId}
                      className={`flex items-center justify-between p-3 border-b last:border-b-0 ${colors.borderSubtle} ${
                        selectedMembers.includes(member.userId)
                          ? `bg-gradient-to-r ${cardCharacters.informative.bg}`
                          : `${colors.cardBg} hover:${colors.cardBgHover}`
                      } transition-all cursor-pointer`}
                      onClick={() => handleMemberToggle(member.userId)}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            selectedMembers.includes(member.userId)
                              ? `${cardCharacters.informative.border} ${cardCharacters.informative.bg}`
                              : colors.border
                          }`}
                        >
                          {selectedMembers.includes(member.userId) && (
                            <CheckCircle className={`w-3.5 h-3.5 ${cardCharacters.informative.iconColor}`} />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${colors.textPrimary}`}>
                            {member.name}
                          </p>
                          <p className={`text-xs ${colors.textMuted}`}>
                            {member.role === 'lead' ? '👑 Group Lead' : 'Member'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedMembers.length > 0 && (
                <p className={`mt-2 text-xs ${colors.textMuted}`}>
                  Selected: {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* File Attachments */}
            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Attachments (Optional)
              </label>
              
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              
              <label
                htmlFor="file-upload"
                className={`group relative flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all ${colors.border} ${colors.cardBg} hover:${colors.cardBgHover}`}
              >
                <Paperclip className={`w-4 h-4 ${colors.textMuted}`} />
                <span className={`text-sm font-medium ${colors.textSecondary}`}>
                  Click to upload files
                </span>
              </label>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg ${colors.cardBg} border ${colors.border}`}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Paperclip className={`w-4 h-4 flex-shrink-0 ${colors.textMuted}`} />
                        <span className={`text-sm truncate ${colors.textPrimary}`}>
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className={`p-1 rounded hover:bg-red-500/10 transition-colors ${cardCharacters.urgent.iconColor}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className={`
          relative px-6 py-4 border-t ${colors.modalFooterBorder}
          ${colors.modalFooterBg} flex justify-end gap-3
        `}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`group relative px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${colors.buttonSecondary} ${colors.buttonSecondaryText} disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedMembers.length === 0}
            className={`group relative px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50 flex items-center space-x-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>Create Deliverable</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}