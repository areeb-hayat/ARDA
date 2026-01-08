// app/components/DeptHeadAnnouncements/NewAnnouncementForm.tsx
'use client';

import React, { useState } from 'react';
import { Calendar, X, AlertCircle, Paperclip, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Attachment } from './types';
import { useTheme } from '@/app/context/ThemeContext';

interface NewAnnouncementFormProps {
  newTitle: string;
  setNewTitle: (title: string) => void;
  newContent: string;
  setNewContent: (content: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  expirationDate: string;
  setExpirationDate: (date: string) => void;
  attachments: Attachment[];
  setAttachments: (attachments: Attachment[]) => void;
  onCancel: () => void;
  onPost: () => void;
}

export default function NewAnnouncementForm({
  newTitle,
  setNewTitle,
  newContent,
  setNewContent,
  selectedColor,
  setSelectedColor,
  expirationDate,
  setExpirationDate,
  attachments,
  setAttachments,
  onCancel,
  onPost
}: NewAnnouncementFormProps) {
  const { colors, theme, cardCharacters } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);
  const [errors, setErrors] = useState({ title: false, content: false });
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Theme-aware color options using card characters
  const colorOptions = [
    { value: theme === 'dark' ? '#64B5F6' : '#2196F3', label: 'Primary Blue', character: 'authoritative' },
    { value: theme === 'dark' ? '#EF5350' : '#F44336', label: 'Urgent Red', character: 'urgent' },
    { value: theme === 'dark' ? '#81C784' : '#4CAF50', label: 'Success Green', character: 'completed' },
    { value: theme === 'dark' ? '#FFB74D' : '#FF9800', label: 'Warning Orange', character: 'interactive' },
    { value: theme === 'dark' ? '#AB47BC' : '#9C27B0', label: 'Creative Purple', character: 'creative' },
    { value: theme === 'dark' ? '#90CAF9' : '#42A5F5', label: 'Info Blue', character: 'informative' },
    { value: theme === 'dark' ? '#FFD54F' : '#FFC107', label: 'Highlight Yellow', character: 'interactive' },
    { value: theme === 'dark' ? '#A1887F' : '#8D6E63', label: 'Neutral Brown', character: 'creative' },
    { value: theme === 'dark' ? '#9E9E9E' : '#757575', label: 'Neutral Gray', character: 'neutral' },
    { value: theme === 'dark' ? '#4DB6AC' : '#009688', label: 'Teal', character: 'informative' }
  ];

  const handlePost = () => {
    const newErrors = {
      title: !newTitle.trim(),
      content: !newContent.trim()
    };
    
    setErrors(newErrors);
    
    if (!newErrors.title && !newErrors.content) {
      onPost();
      setErrors({ title: false, content: false });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);

    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      try {
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
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

        // Determine file type
        const isImage = file.type.startsWith('image/');
        
        newAttachments.push({
          name: file.name,
          url: base64, // Store base64 temporarily, will be saved to disk on submit
          type: isImage ? 'image' : 'document',
          size: file.size,
          uploadedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        alert(`Failed to process file: ${file.name}`);
      }
    }

    setAttachments([...attachments, ...newAttachments]);
    setUploadingFiles(false);
    e.target.value = ''; // Reset input
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const generateCalendarDays = () => {
    const [year, month] = expirationDate ? expirationDate.split('-').map(Number) : 
                          [new Date().getFullYear(), new Date().getMonth() + 1];
    
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const prevLastDay = new Date(year, month - 1, 0);
    
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = prevLastDay.getDate();
    
    const days = [];
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPast: true });
    }
    
    const todayDate = new Date();
    const todayDay = todayDate.getDate();
    const todayMonth = todayDate.getMonth() + 1;
    const todayYear = todayDate.getFullYear();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isPast = year < todayYear || 
                     (year === todayYear && month < todayMonth) || 
                     (year === todayYear && month === todayMonth && i < todayDay);
      days.push({ day: i, isCurrentMonth: true, isPast });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, isPast: false });
    }
    
    return days;
  };

  const handleDateSelect = (day: number, isCurrentMonth: boolean, isPast: boolean) => {
    if (isPast || !isCurrentMonth) return;
    
    const [year, month] = expirationDate ? expirationDate.split('-').map(Number) : 
                          [new Date().getFullYear(), new Date().getMonth() + 1];
    
    const selectedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setExpirationDate(selectedDate);
    setShowCalendar(false);
  };

  const changeMonth = (delta: number) => {
    const [year, month] = expirationDate ? expirationDate.split('-').map(Number) : 
                          [new Date().getFullYear(), new Date().getMonth() + 1];
    
    let newMonth = month + delta;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setExpirationDate(`${newYear}-${String(newMonth).padStart(2, '0')}-01`);
  };

  const getMonthYear = () => {
    const [year, month] = expirationDate ? expirationDate.split('-').map(Number) : 
                          [new Date().getFullYear(), new Date().getMonth() + 1];
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getSelectedDateFormatted = () => {
    if (!expirationDate) return 'Select expiration date';
    const date = new Date(expirationDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-base font-black ${colors.textPrimary}`}>New Announcement</h4>
        <button
          onClick={onCancel}
          className={`p-1 hover:${colors.cardBgHover} rounded-md transition-all`}
        >
          <X className={`h-4 w-4 ${colors.textPrimary}`} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Title Input */}
        <div>
          <input
            type="text"
            placeholder="Announcement Title"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: false });
            }}
            className={`w-full px-3 py-2 ${colors.inputBg} backdrop-blur-sm border-2 rounded-lg ${colors.textPrimary} text-sm ${colors.inputPlaceholder} focus:outline-none font-bold transition-all ${
              errors.title 
                ? `border-red-500 shadow-[0_0_10px_${theme === 'dark' ? 'rgba(239,83,80,0.5)' : 'rgba(244,67,54,0.5)'}]`
                : `${colors.inputBorder} focus:${colors.borderStrong}`
            }`}
          />
          {errors.title && (
            <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-semibold ${cardCharacters.urgent.text}`}>
              <AlertCircle className="h-3 w-3" />
              Title is required
            </div>
          )}
        </div>

        {/* Content Textarea */}
        <div>
          <textarea
            placeholder="Announcement Content"
            value={newContent}
            onChange={(e) => {
              setNewContent(e.target.value);
              if (errors.content) setErrors({ ...errors, content: false });
            }}
            rows={3}
            className={`w-full px-3 py-2 ${colors.inputBg} backdrop-blur-sm border-2 rounded-lg ${colors.textPrimary} text-sm ${colors.inputPlaceholder} focus:outline-none font-semibold resize-none transition-all ${
              errors.content 
                ? `border-red-500 shadow-[0_0_10px_${theme === 'dark' ? 'rgba(239,83,80,0.5)' : 'rgba(244,67,54,0.5)'}]`
                : `${colors.inputBorder} focus:${colors.borderStrong}`
            }`}
          />
          {errors.content && (
            <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-semibold ${cardCharacters.urgent.text}`}>
              <AlertCircle className="h-3 w-3" />
              Content is required
            </div>
          )}
        </div>

        {/* Attachments */}
        <div>
          <label className={`flex items-center gap-1.5 px-3 py-2 ${colors.inputBg} hover:${colors.inputFocusBg} border-2 ${colors.inputBorder} hover:${colors.borderStrong} rounded-lg ${colors.textPrimary} text-sm font-bold cursor-pointer transition-all w-fit ${uploadingFiles ? 'opacity-50 cursor-wait' : ''}`}>
            <Paperclip className="h-3.5 w-3.5" />
            {uploadingFiles ? 'Uploading...' : 'Add Attachments'}
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileUpload}
              disabled={uploadingFiles}
              className="hidden"
            />
          </label>
          
          {attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className={`text-xs font-semibold ${colors.textSecondary}`}>
                {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
              </p>
              {attachments.map((attachment, idx) => (
                <div key={idx} className={`flex items-center gap-2 p-2 bg-gradient-to-br ${colors.glassBg} rounded-md border ${colors.border}`}>
                  {attachment.type === 'image' ? (
                    <ImageIcon className={`h-3.5 w-3.5 ${colors.textAccent}`} />
                  ) : (
                    <FileText className={`h-3.5 w-3.5 ${colors.textAccent}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${colors.textPrimary} truncate font-semibold`}>{attachment.name}</p>
                    <p className={`text-xs ${colors.textMuted}`}>{formatFileSize(attachment.size)}</p>
                  </div>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="p-1 hover:bg-red-500/50 rounded transition-all"
                    title="Remove attachment"
                  >
                    <Trash2 className={`h-3 w-3 ${colors.textPrimary}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Color Selection */}
        <div>
          <label className={`block text-xs font-bold ${colors.textPrimary} mb-1.5`}>Announcement Theme</label>
          <div className="grid grid-cols-5 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`relative h-10 rounded-md transition-all border-2 overflow-hidden ${
                  selectedColor === color.value
                    ? `${colors.borderStrong} shadow-lg scale-105`
                    : `${colors.border} hover:scale-105`
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              >
                {selectedColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.value }}></div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Section - Keeping existing implementation */}
        <div className="relative">
          <label className={`block text-xs font-bold ${colors.textPrimary} mb-2 flex items-center gap-1.5`}>
            <Calendar className={`h-3.5 w-3.5 ${colors.textAccent}`} />
            Expiration Date (Optional - Expires at 5:00 PM)
          </label>
          
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={`flex-1 h-10 px-3 py-2 ${colors.inputBg} backdrop-blur-sm border-2 ${colors.inputBorder} rounded-lg ${colors.textPrimary} text-sm font-semibold text-left transition-all hover:${colors.borderStrong} focus:outline-none`}
            >
              <div className="flex items-center justify-between">
                <span className={expirationDate ? colors.textPrimary : colors.textMuted}>
                  {getSelectedDateFormatted()}
                </span>
                <Calendar className={`h-3.5 w-3.5 ${colors.textAccent}`} />
              </div>
            </button>
            
            {expirationDate && (
              <button
                onClick={() => setExpirationDate('')}
                className={`h-10 px-3 py-2 bg-gradient-to-br ${cardCharacters.urgent.bg} border-2 ${cardCharacters.urgent.border} rounded-lg ${cardCharacters.urgent.text} text-xs font-bold transition-all flex items-center gap-1.5`}
                title="Clear expiration date"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Calendar Popup - Keeping existing implementation with theme colors */}
          {showCalendar && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowCalendar(false)}
              />
              
              <div 
                className={`absolute z-50 mt-1.5 p-3 bg-gradient-to-br ${colors.cardBg} backdrop-blur-xl border-2 rounded-lg w-full max-w-sm ${colors.shadowDropdown}`}
                style={{
                  borderColor: selectedColor
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => changeMonth(-1)}
                    className={`p-1.5 hover:${colors.cardBgHover} rounded-md transition-all ${colors.textPrimary} font-bold text-lg`}
                  >
                    ←
                  </button>
                  <span 
                    className="font-black text-sm"
                    style={{ color: selectedColor }}
                  >
                    {getMonthYear()}
                  </span>
                  <button
                    onClick={() => changeMonth(1)}
                    className={`p-1.5 hover:${colors.cardBgHover} rounded-md transition-all ${colors.textPrimary} font-bold text-lg`}
                  >
                    →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div 
                      key={day} 
                      className="text-center font-bold text-xs py-1.5"
                      style={{ color: selectedColor }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {generateCalendarDays().map((dayObj, idx) => {
                    const isSelected = expirationDate && 
                      parseInt(expirationDate.split('-')[2]) === dayObj.day && 
                      dayObj.isCurrentMonth;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleDateSelect(dayObj.day, dayObj.isCurrentMonth, dayObj.isPast)}
                        disabled={dayObj.isPast || !dayObj.isCurrentMonth}
                        className={`
                          aspect-square p-1 rounded-md text-xs font-semibold transition-all
                          ${!dayObj.isCurrentMonth ? `${colors.textMuted} opacity-30 cursor-default` : ''}
                          ${dayObj.isPast ? `${colors.textMuted} opacity-50 cursor-not-allowed line-through` : ''}
                          ${dayObj.isCurrentMonth && !dayObj.isPast ? `${colors.textPrimary} hover:${colors.cardBgHover} cursor-pointer` : ''}
                        `}
                        style={isSelected ? {
                          backgroundColor: selectedColor,
                          border: `2px solid ${colors.borderStrong}`,
                          fontWeight: 'bold',
                          color: 'white'
                        } : {}}
                      >
                        {dayObj.day}
                      </button>
                    );
                  })}
                </div>

                <div className={`flex gap-1.5 mt-3 pt-3 border-t-2 ${colors.borderSubtle}`}>
                  <button
                    onClick={() => {
                      setExpirationDate('');
                      setShowCalendar(false);
                    }}
                    className={`flex-1 px-3 py-1.5 bg-gradient-to-br ${colors.glassBg} hover:${colors.cardBgHover} rounded-md ${colors.textPrimary} text-xs font-semibold transition-all`}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="flex-1 px-3 py-1.5 rounded-md text-white text-xs font-semibold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: selectedColor
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </>
          )}

          {expirationDate && (
            <div 
              className={`mt-2 p-2 border-2 rounded-md bg-gradient-to-br ${cardCharacters.interactive.bg} ${cardCharacters.interactive.border}`}
            >
              <p className={`text-xs font-semibold ${cardCharacters.interactive.text}`}>
                ⏰ Expires at 5:00 PM on {new Date(expirationDate + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1.5">
          <button
            onClick={handlePost}
            disabled={uploadingFiles}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-bold transition-all hover:opacity-90 border-2 ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              backgroundColor: selectedColor,
              borderColor: selectedColor
            }}
          >
            {uploadingFiles ? 'Processing Files...' : 'Post Announcement'}
          </button>
          <button
            onClick={onCancel}
            className={`px-4 py-2 bg-gradient-to-br ${colors.glassBg} hover:${colors.cardBgHover} rounded-lg ${colors.textPrimary} text-sm font-bold transition-all border ${colors.border}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}