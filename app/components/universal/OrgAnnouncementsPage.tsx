// app/components/universal/OrgAnnouncementsPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Globe, ArrowLeft, Pin, Maximize2, Minimize2, Paperclip, Download, FileText, Image as ImageIcon, X, Search, Filter, SortAsc, SortDesc, Plus, Edit2, Check, Trash2 } from 'lucide-react';
import OrgAnnouncementForm from '../OrgAnnouncements/OrgAnnouncementForm';

interface Attachment {
  name: string;
  url: string;
  type: 'image' | 'document';
  size: number;
  uploadedAt: string;
}

interface OrgAnnouncement {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  pinned?: boolean;
  edited?: boolean;
  expirationDate?: string;
  borderColor?: string;
  attachments?: Attachment[];
  targetAudience?: string;
}

interface OrgAnnouncementsPageProps {
  onBack?: () => void;
  isHREmployee?: boolean;
  userDepartment?: string;
}

export default function OrgAnnouncementsPage({ onBack, isHREmployee = false, userDepartment = '' }: OrgAnnouncementsPageProps) {
  const { theme, colors, showToast } = useTheme();
  
  // Use emerald/teal colors for org announcements
  const orgColor = theme === 'dark' ? '#10B981' : '#059669';
  const orgColorLight = theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)';
  const orgBorder = theme === 'dark' ? 'border-emerald-500/60' : 'border-emerald-600';
  const iconColor = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';
  
  const [announcements, setAnnouncements] = useState<OrgAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'pinned'>('all');
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
  const [targetAudience, setTargetAudience] = useState('organization');
  
  // Edit states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);

  // Theme-aware text colors
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-white/90' : 'text-gray-800';
  const textMutedColor = theme === 'dark' ? 'text-white/60' : 'text-gray-500';
  
  // Button and input colors
  const buttonBg = theme === 'dark' ? 'bg-black/50' : 'bg-white/70';
  const buttonHoverBg = theme === 'dark' ? 'hover:bg-black/70' : 'hover:bg-white/90';
  const buttonBorder = theme === 'dark' ? 'border-white/20' : 'border-gray-300';
  const buttonHoverBorder = theme === 'dark' ? 'hover:border-white/40' : 'hover:border-gray-400';
  const btnIconColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  
  const inputBg = theme === 'dark' ? 'bg-black/30' : 'bg-white/50';
  const inputBorder = theme === 'dark' ? 'border-white/20' : 'border-gray-300';
  const inputFocusBorder = theme === 'dark' ? 'focus:border-white/40' : 'focus:border-gray-500';

  useEffect(() => {
    fetchAnnouncements();
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserDisplayName(user.displayName || user.username || 'Unknown User');
    }
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`/api/org-announcements?department=${userDepartment}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      } else {
        showToast('Failed to fetch announcements', 'error');
      }
    } catch (error) {
      console.error('Error fetching org announcements:', error);
      showToast('Error fetching announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const response = await fetch('/api/org-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          author: userDisplayName,
          expirationDate: expirationDate || undefined,
          attachments: newAttachments,
          targetAudience: targetAudience
        })
      });

      if (response.ok) {
        setNewTitle('');
        setNewContent('');
        setExpirationDate('');
        setNewAttachments([]);
        setTargetAudience('organization');
        setShowNewAnnouncement(false);
        fetchAnnouncements();
        showToast('Organization announcement created successfully', 'success');
      } else {
        const errorData = await response.json();
        console.error('Error creating announcement:', errorData);
        showToast(errorData.error || 'Failed to create announcement', 'error');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      showToast('Error creating announcement', 'error');
    }
  };

  const updateAnnouncement = async (id: string, updates: any) => {
    try {
      const response = await fetch('/api/org-announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      if (response.ok) {
        fetchAnnouncements();
        showToast('Announcement updated successfully', 'success');
      } else {
        showToast('Failed to update announcement', 'error');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      showToast('Error updating announcement', 'error');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(`/api/org-announcements?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (expandedId === id) setExpandedId(null);
        fetchAnnouncements();
        showToast('Announcement deleted', 'success');
      } else {
        showToast('Failed to delete announcement', 'error');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showToast('Error deleting announcement', 'error');
    }
  };

  const startEdit = (announcement: OrgAnnouncement) => {
    setEditingId(announcement._id);
    setEditTitle(announcement.title);
    setEditContent(announcement.content);
    setEditAttachments(announcement.attachments || []);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim() || !editContent.trim()) return;

    await updateAnnouncement(id, {
      title: editTitle,
      content: editContent,
      attachments: editAttachments
    });

    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setEditAttachments([]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setEditAttachments([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      try {
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          name: file.name,
          url: base64,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          size: file.size,
          uploadedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        alert(`Failed to process file: ${file.name}`);
      }
    }

    setEditAttachments([...editAttachments, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setEditAttachments(editAttachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const filteredAndSortedAnnouncements = announcements
    .filter(announcement => {
      const matchesSearch = 
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        filterBy === 'all' ||
        (filterBy === 'pinned' && announcement.pinned);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
    });

  const displayedAnnouncements = expandedId
    ? filteredAndSortedAnnouncements.filter(a => a._id === expandedId)
    : filteredAndSortedAnnouncements;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className={`w-12 h-12 border-2 ${colors.textAccent} border-t-transparent rounded-full animate-spin mx-auto mb-3`}></div>
        <p className={`${colors.textPrimary} font-semibold`}>Loading organization announcements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className={`relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl p-5 border-2 ${orgBorder} ${colors.shadowCard}`}>
        {/* Paper Texture */}
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className={`group relative flex items-center justify-center p-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${orgBorder} ${colors.borderHover} backdrop-blur-sm ${colors.shadowCard} hover:${colors.shadowHover}`}
              >
                {/* Paper Texture */}
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                
                {/* Internal Glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 14px ${orgColor}80, inset 0 0 28px ${orgColor}40` }}
                ></div>
                
                <ArrowLeft className={`h-5 w-5 relative z-10 transition-transform duration-300 group-hover:-translate-x-1 icon-rotate ${iconColor}`} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Globe className={`h-6 w-6 ${iconColor}`} />
                  <h1 className={`text-2xl font-black ${colors.textPrimary}`}>
                    Organization Announcements
                  </h1>
                </div>
                <p className={`text-sm ${colors.textMuted} font-semibold mt-1`}>
                  {filteredAndSortedAnnouncements.length} of {announcements.length} company-wide announcement{announcements.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {isHREmployee && (
              <button
                onClick={() => setShowNewAnnouncement(!showNewAnnouncement)}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${orgBorder} ${colors.borderHover} backdrop-blur-sm ${colors.shadowCard} hover:${colors.shadowHover}`}
              >
                {/* Paper Texture */}
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                
                {/* Internal Glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 14px ${orgColor}80, inset 0 0 28px ${orgColor}40` }}
                ></div>
                
                <Plus className={`h-5 w-5 relative z-10 transition-transform duration-300 group-hover:rotate-90 icon-rotate ${iconColor}`} />
                <span className={`text-sm font-bold relative z-10 ${iconColor}`}>New Announcement</span>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[250px] relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.textMuted}`} />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 ${colors.inputBg} ${colors.inputText} backdrop-blur-sm border-2 ${colors.inputBorder} ${colors.inputFocusBg} rounded-lg text-sm ${colors.inputPlaceholder} font-semibold transition-all`}
              />
            </div>

            <div className="relative">
              <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.textMuted} pointer-events-none`} />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className={`pl-10 pr-8 py-2 ${colors.dropdownBg} ${colors.dropdownText} backdrop-blur-sm border-2 ${colors.dropdownBorder} rounded-lg text-sm font-semibold appearance-none cursor-pointer transition-all`}
              >
                <option value="all">All Announcements</option>
                <option value="pinned">Pinned Only</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`pl-4 pr-8 py-2 ${colors.dropdownBg} ${colors.dropdownText} backdrop-blur-sm border-2 ${colors.dropdownBorder} rounded-lg text-sm font-semibold appearance-none cursor-pointer transition-all`}
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`group relative px-3 py-2 ${colors.inputBg} backdrop-blur-sm border-2 ${colors.inputBorder} ${colors.borderHover} rounded-lg transition-all duration-300 overflow-hidden`}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {/* Internal Glow */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
              ></div>
              
              {sortOrder === 'asc' ? (
                <SortAsc className={`h-5 w-5 relative z-10 ${colors.textPrimary} transition-transform duration-300 group-hover:scale-110`} />
              ) : (
                <SortDesc className={`h-5 w-5 relative z-10 ${colors.textPrimary} transition-transform duration-300 group-hover:scale-110`} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* New Announcement Form */}
      {isHREmployee && showNewAnnouncement && (
        <div className={`relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl border-2 ${orgBorder} ${colors.shadowCard}`}> 
          {/* Paper Texture */}
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative z-10">
            <OrgAnnouncementForm
              newTitle={newTitle}
              setNewTitle={setNewTitle}
              newContent={newContent}
              setNewContent={setNewContent}
              expirationDate={expirationDate}
              setExpirationDate={setExpirationDate}
              attachments={newAttachments}
              setAttachments={setNewAttachments}
              targetAudience={targetAudience}
              setTargetAudience={setTargetAudience}
              onCancel={() => {
                setShowNewAnnouncement(false);
                setNewTitle('');
                setNewContent('');
                setExpirationDate('');
                setNewAttachments([]);
                setTargetAudience('organization');
              }}
              onPost={createAnnouncement}
            />
          </div>
        </div>
      )}

      {/* Announcements Display */}
      {filteredAndSortedAnnouncements.length === 0 ? (
        <div className={`relative overflow-hidden text-center py-12 backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl border-2 ${orgBorder} ${colors.shadowCard}`}>
          {/* Paper Texture */}
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative z-10">
            <Globe className={`h-12 w-12 ${iconColor} mx-auto mb-3`} />
            <p className={`${colors.textAccent} text-base font-semibold`}>
              {searchQuery || filterBy !== 'all' ? 'No matching announcements found' : 'No organization announcements yet'}
            </p>
            <p className={`${colors.textMuted} text-sm mt-1.5`}>
              {searchQuery || filterBy !== 'all' ? 'Try adjusting your search or filters' : isHREmployee ? 'Create your first organization announcement to get started' : 'Check back later for company-wide updates'}
            </p>
          </div>
        </div>
      ) : (
        <div className={`${expandedId ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
          {displayedAnnouncements.map((announcement) => {
            const isExpanded = expandedId === announcement._id;
            const isEditing = editingId === announcement._id;
            const contentLength = announcement.content?.length || 0;
            const isLongContent = contentLength > 150;
            
            return (
              <div
                key={announcement._id}
                className={`org-announcement-card relative rounded-xl transition-all duration-300 border-2 ${orgBorder} overflow-hidden group ${
                  isExpanded ? 'col-span-full' : ''
                }`}
                style={{
                  backgroundColor: orgColorLight,
                  ['--glow-color' as any]: orgColor
                }}
              >
                {/* Paper Texture */}
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 20px ${orgColor}80, inset 0 0 40px ${orgColor}40`
                  }}
                ></div>

                <div className="relative p-4 h-full z-10">
                  <div className="flex justify-end gap-1.5 mb-3">
                    {announcement.pinned && (
                      <div className={`p-1 rounded-md border-2 bg-gradient-to-br ${colors.glassBg} ${orgBorder}`}>
                        <Pin className={`h-3 w-3 ${iconColor}`} fill="currentColor" />
                      </div>
                    )}
                    {isHREmployee && (
                      <>
                        <button
                          onClick={() => updateAnnouncement(announcement._id, { pinned: !announcement.pinned })}
                          className={`p-1 ${buttonBg} ${buttonHoverBg} rounded-md transition-all backdrop-blur-sm border ${buttonBorder} ${buttonHoverBorder}`}
                          title="Toggle Pin"
                        >
                          <Pin className={`h-3 w-3 ${announcement.pinned ? iconColor : btnIconColor}`} />
                        </button>
                        {!isEditing && (
                          <button
                            onClick={() => startEdit(announcement)}
                            className={`p-1 ${buttonBg} ${buttonHoverBg} rounded-md transition-all backdrop-blur-sm border ${buttonBorder} ${buttonHoverBorder}`}
                            title="Edit"
                          >
                            <Edit2 className={`h-3 w-3 ${btnIconColor}`} />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : announcement._id)}
                      className={`p-1 ${buttonBg} ${buttonHoverBg} rounded-md transition-all backdrop-blur-sm border ${buttonBorder} ${buttonHoverBorder}`}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <Minimize2 className={`h-3 w-3 ${btnIconColor}`} />
                      ) : (
                        <Maximize2 className={`h-3 w-3 ${btnIconColor}`} />
                      )}
                    </button>
                    {isHREmployee && (
                      <button
                        onClick={() => deleteAnnouncement(announcement._id)}
                        className={`p-1 ${buttonBg} hover:bg-red-500/70 rounded-md transition-all backdrop-blur-sm border ${buttonBorder} hover:border-red-500/60`}
                        title="Delete"
                      >
                        <X className={`h-3 w-3 ${btnIconColor}`} />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={`w-full mb-2 px-2 py-1.5 ${inputBg} backdrop-blur-sm border ${inputBorder} ${inputFocusBorder} rounded-md ${textColor} focus:outline-none font-black text-base`}
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className={`w-full mb-3 px-2 py-1.5 ${inputBg} backdrop-blur-sm border ${inputBorder} ${inputFocusBorder} rounded-md ${textColor} focus:outline-none font-semibold resize-none text-sm`}
                      />
                      
                      <div className="mb-3">
                        <label className={`flex items-center gap-1.5 px-3 py-1.5 ${inputBg} ${buttonHoverBg} border ${buttonBorder} rounded-md ${textColor} font-semibold cursor-pointer transition-all w-fit text-xs`}>
                          <Paperclip className="h-3 w-3" />
                          Add Attachments
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        
                        {editAttachments.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {editAttachments.map((attachment, idx) => (
                              <div key={idx} className={`flex items-center gap-1.5 p-1.5 ${inputBg} rounded-md border ${buttonBorder}`}>
                                {attachment.type === 'image' ? (
                                  <ImageIcon className={`h-3 w-3 ${iconColor}`} />
                                ) : (
                                  <FileText className={`h-3 w-3 ${iconColor}`} />
                                )}
                                <span className={`text-xs ${textColor} flex-1 truncate`}>{attachment.name}</span>
                                <span className={`text-[10px] ${textMutedColor}`}>{formatFileSize(attachment.size)}</span>
                                <button
                                  onClick={() => removeAttachment(idx)}
                                  className="p-0.5 hover:bg-red-500/50 rounded transition-all"
                                >
                                  <Trash2 className={`h-2.5 w-2.5 ${btnIconColor}`} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => saveEdit(announcement._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all text-xs border-2"
                          style={{
                            backgroundColor: orgColor,
                            borderColor: orgColor,
                            color: 'white'
                          }}
                        >
                          <Check className="h-3 w-3" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className={`px-3 py-1.5 rounded-md font-bold transition-all text-xs bg-gradient-to-br ${colors.glassBg} ${textColor} border ${buttonBorder}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 mb-2">
                        <h4 className={`text-base font-black ${textColor} break-words`}>{announcement.title}</h4>
                        {announcement.edited && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-br ${colors.glassBg} ${textMutedColor} flex-shrink-0`}>
                            EDITED
                          </span>
                        )}
                      </div>
                      
                      {announcement.targetAudience && announcement.targetAudience !== 'organization' && (
                        <div className="mb-2">
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold"
                            style={{
                              backgroundColor: `${orgColor}30`,
                              color: orgColor,
                              border: `1px solid ${orgColor}60`
                            }}
                          >
                            {announcement.targetAudience} Department
                          </span>
                        </div>
                      )}
                      
                      <div className="relative mb-1.5">
                        <p className={`${textSecondaryColor} font-semibold leading-relaxed text-sm ${!isExpanded && isLongContent ? 'line-clamp-3' : 'whitespace-pre-wrap'}`}>
                          {announcement.content}
                        </p>
                        {isLongContent && !isExpanded && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : announcement._id)}
                            className={`text-xs font-bold hover:opacity-80 transition-all mt-1.5 flex items-center gap-0.5 ${iconColor}`}
                          >
                            Read More →
                          </button>
                        )}
                      </div>

                      {announcement.attachments && announcement.attachments.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${textMutedColor}`}>
                            <Paperclip className="h-3 w-3" />
                            Attachments ({announcement.attachments.length})
                          </div>
                          <div className={`grid ${isExpanded ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
                            {announcement.attachments.map((attachment, idx) => (
                              <div key={idx}>
                                {attachment.type === 'image' && isExpanded ? (
                                  <div 
                                    className="relative group/img cursor-pointer"
                                    onClick={() => setSelectedImage(attachment.url)}
                                  >
                                    <img 
                                      src={attachment.url} 
                                      alt={attachment.name}
                                      className={`w-full h-32 object-cover rounded-md border-2 ${buttonBorder} ${buttonHoverBorder} transition-all`}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-all rounded-md flex items-center justify-center">
                                      <span className="text-white font-semibold text-xs">Click to view</span>
                                    </div>
                                  </div>
                                ) : (
                                  <a
                                    href={attachment.url}
                                    download={attachment.name}
                                    className={`flex items-center gap-1.5 p-2 ${inputBg} ${buttonHoverBg} rounded-md border ${buttonBorder} ${buttonHoverBorder} transition-all group/link backdrop-blur-sm`}
                                  >
                                    {attachment.type === 'image' ? (
                                      <ImageIcon className={`h-4 w-4 ${btnIconColor}`} />
                                    ) : (
                                      <FileText className={`h-4 w-4 ${btnIconColor}`} />
                                    )}
                                    <span className={`text-xs ${textColor} flex-1 truncate font-semibold`}>{attachment.name}</span>
                                    <span className={`text-[10px] ${textMutedColor} mr-1.5`}>{formatFileSize(attachment.size)}</span>
                                    <Download className={`h-3 w-3 ${textMutedColor} group-hover/link:${textColor} transition-all`} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {announcement.expirationDate && (
                        <div 
                          className="mt-2 p-1.5 rounded-md border"
                          style={{ 
                            backgroundColor: `${orgColor}20`,
                            borderColor: `${orgColor}60`
                          }}
                        >
                          <p className="text-[10px] font-semibold" style={{ color: orgColor }}>
                            Expires at 5:00 PM on {new Date(announcement.expirationDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      )}
                      
                      <div className={`mt-3 pt-2 border-t ${theme === 'dark' ? 'border-white/20' : 'border-gray-300'}`}>
                        <div className="flex items-center justify-between">
                          <p className={`text-[10px] ${textMutedColor} font-bold`}>
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                          <p className={`text-[10px] ${textMutedColor} font-semibold`}>
                            By: {announcement.author}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            <img 
              src={selectedImage} 
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}