// ===== app/components/calendars/EventCreator.tsx =====
'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  X,
  Calendar,
  Clock,
  Save,
  ChevronDown
} from 'lucide-react';

interface EventCreatorProps {
  userId: string;
  userName: string;
  initialDate: Date;
  onClose: () => void;
  onEventCreated: () => void;
}

export default function EventCreator({
  userId,
  userName,
  initialDate,
  onClose,
  onEventCreated
}: EventCreatorProps) {
  const { colors, cardCharacters, showToast } = useTheme();
  
  const [type, setType] = useState<string>('task-block');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date(initialDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [duration, setDuration] = useState(2); // Duration in 30-minute blocks (1 hour default)
  const [priority, setPriority] = useState('medium');
  const [color, setColor] = useState('#2196F3');
  const [allDay, setAllDay] = useState(false);
  const [hasReminder, setHasReminder] = useState(true);
  const [creating, setCreating] = useState(false);

  const eventTypes = [
    { value: 'meeting', label: 'Meeting', icon: '👥' },
    { value: 'task-block', label: 'Task Block', icon: '📋' },
    { value: 'deadline', label: 'Deadline', icon: '🎯' },
    { value: 'focus-block', label: 'Focus Block', icon: '🎯' },
    { value: 'recovery-block', label: 'Recovery Block', icon: '🧘' },
    { value: 'reminder', label: 'Reminder', icon: '🔔' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', char: cardCharacters.neutral },
    { value: 'medium', label: 'Medium', char: cardCharacters.informative },
    { value: 'high', label: 'High', char: cardCharacters.creative },
    { value: 'urgent', label: 'Urgent', char: cardCharacters.urgent }
  ];

  const colors_preset = [
    '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4',
    '#E91E63', '#3F51B5', '#009688', '#FFC107', '#795548', '#607D8B'
  ];

  // Duration options up to 2 hours (4 blocks)
  const quickDurations = [
    { value: 1, label: '30 min' },
    { value: 2, label: '1 hr' },
    { value: 3, label: '1.5 hrs' },
    { value: 4, label: '2 hrs' }
  ];

  // Extended duration options
  const extendedDurations = [];
  for (let i = 5; i <= 16; i++) {
    const hours = i * 0.5;
    const label = hours === Math.floor(hours) ? `${Math.floor(hours)} hrs` : `${Math.floor(hours)}.5 hrs`;
    extendedDurations.push({ value: i, label });
  }

  const calculateEndTime = (hour: string, minute: string, durationBlocks: number) => {
    const totalMinutes = parseInt(hour) * 60 + parseInt(minute) + (durationBlocks * 30);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a title', 'warning');
      return;
    }

    try {
      setCreating(true);

      const eventData: any = {
        userId,
        type,
        title: title.trim(),
        description: description.trim(),
        priority,
        color,
        hasReminder,
        reminderMinutesBefore: 15,
        createdBy: {
          userId,
          name: userName
        }
      };

      if (type !== 'deadline' && type !== 'reminder') {
        const startTime = `${startHour}:${startMinute}`;
        const endTime = calculateEndTime(startHour, startMinute, duration);
        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(`${date}T${endTime}`);
        
        eventData.startTime = startDateTime.toISOString();
        eventData.endTime = endDateTime.toISOString();
        eventData.allDay = allDay;
      } else {
        const deadlineDate = new Date(date);
        deadlineDate.setHours(23, 59, 59, 999);
        eventData.startTime = deadlineDate.toISOString();
        eventData.endTime = deadlineDate.toISOString();
      }

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Time intent created successfully', 'success');
        onEventCreated();
      } else if (response.status === 409) {
        showToast('Time slot conflict detected. Please choose a different time.', 'warning');
      } else {
        showToast(data.error || 'Failed to create event', 'error');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      showToast('Failed to create event', 'error');
    } finally {
      setCreating(false);
    }
  };

  const charColors = cardCharacters.creative;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`relative w-full max-w-2xl max-h-[95vh] overflow-hidden rounded-xl border backdrop-blur-lg ${colors.modalBg} ${colors.modalBorder} ${colors.modalShadow} animate-modalSlideIn`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

        {/* Header */}
        <div className={`relative border-b ${colors.modalBorder} ${colors.modalHeaderBg} p-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                <Calendar className={`w-5 h-5 ${charColors.iconColor}`} />
              </div>
              <h2 className={`text-xl font-black ${colors.modalHeaderText}`}>Create Time Intent</h2>
            </div>

            <button
              onClick={onClose}
              className={`group relative p-2 rounded-lg transition-all duration-300 overflow-hidden border ${charColors.border} ${charColors.bg}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowSecondary}` }}
              ></div>
              <X className={`w-5 h-5 relative z-10 ${charColors.iconColor} transition-transform duration-300 group-hover:rotate-90`} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative overflow-y-auto max-h-[calc(95vh-140px)] p-5 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current/20">
          
          {/* Event Type */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-2 block uppercase`}>Intent Type</label>
            <div className="grid grid-cols-3 gap-2">
              {eventTypes.map(et => (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => setType(et.value)}
                  className={`group relative p-3 rounded-lg text-sm font-bold transition-all duration-300 overflow-hidden ${
                    type === et.value
                      ? `${charColors.bg} ${charColors.text} border-2 ${charColors.border}`
                      : `${colors.inputBg} ${colors.textMuted} border ${colors.inputBorder}`
                  }`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${type === et.value ? colors.glowSecondary : colors.glowPrimary}` }}
                  ></div>
                  <span className="text-lg block mb-1 relative z-10">{et.icon}</span>
                  <span className="relative z-10">{et.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-1 block`}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your intent..."
              required
              className={`w-full px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} focus:ring-2 focus:ring-opacity-50 transition-all`}
              style={{ focusRingColor: charColors.iconColor.replace('text-', '') }}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-1 block`}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this intent..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} focus:ring-2 focus:ring-opacity-50 transition-all`}
            />
          </div>

          {/* Date */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-1 block`}>Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} focus:ring-2 focus:ring-opacity-50 transition-all`}
            />
          </div>

          {/* Time Selection - Optimized Dropdowns */}
          {type !== 'deadline' && type !== 'reminder' && (
            <>
              <div>
                <label className={`text-xs font-bold ${colors.textSecondary} mb-1 block flex items-center gap-2`}>
                  <Clock className="w-3 h-3" />
                  Start Time
                </label>
                <div className="flex gap-2">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    disabled={allDay}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} disabled:opacity-50 focus:ring-2 focus:ring-opacity-50 transition-all appearance-none cursor-pointer`}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = String(i).padStart(2, '0');
                      const displayHour = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
                      return <option key={hour} value={hour}>{displayHour}</option>;
                    })}
                  </select>
                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    disabled={allDay}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} disabled:opacity-50 focus:ring-2 focus:ring-opacity-50 transition-all appearance-none cursor-pointer`}
                  >
                    <option value="00">00</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </div>
              </div>

              {/* Duration - Quick Options */}
              <div>
                <label className={`text-xs font-bold ${colors.textSecondary} mb-2 block`}>Duration</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {quickDurations.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDuration(opt.value)}
                      disabled={allDay}
                      className={`group relative p-2.5 rounded-lg text-xs font-bold transition-all duration-300 overflow-hidden disabled:opacity-50 ${
                        duration === opt.value
                          ? `${cardCharacters.informative.bg} ${cardCharacters.informative.text} border-2 ${cardCharacters.informative.border}`
                          : `${colors.inputBg} ${colors.textMuted} border ${colors.inputBorder}`
                      }`}
                    >
                      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                      ></div>
                      <span className="relative z-10">{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Extended Duration Dropdown */}
                <select
                  value={duration > 4 ? duration : ''}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  disabled={allDay}
                  className={`w-full px-3 py-2 rounded-lg text-xs ${colors.inputBg} border ${colors.inputBorder} ${colors.textMuted} disabled:opacity-50 focus:ring-2 focus:ring-opacity-50 transition-all appearance-none cursor-pointer`}
                >
                  <option value="">More than 2 hours...</option>
                  {extendedDurations.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {!allDay && (
                  <p className={`text-xs ${colors.textMuted} mt-2 flex items-center gap-1`}>
                    <Clock className="w-3 h-3" />
                    Ends at: {new Date(`2000-01-01T${calculateEndTime(startHour, startMinute, duration)}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                )}
              </div>
            </>
          )}

          {/* All Day Toggle */}
          {type !== 'deadline' && type !== 'reminder' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className={`w-4 h-4 rounded cursor-pointer`}
              />
              <label htmlFor="allDay" className={`text-sm ${colors.textPrimary} cursor-pointer`}>
                All day event
              </label>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-2 block uppercase`}>Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`group relative p-2.5 rounded-lg text-xs font-bold capitalize transition-all duration-300 overflow-hidden ${
                    priority === p.value
                      ? `${p.char.bg} ${p.char.text} border-2 ${p.char.border}`
                      : `${colors.inputBg} ${colors.textMuted} border ${colors.inputBorder}`
                  }`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${priority === p.value ? p.char.iconColor.replace('text-', '') : colors.glowPrimary}` }}
                  ></div>
                  <span className="relative z-10">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color - Styled like Duration */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-2 block uppercase`}>Color</label>
            <div className="grid grid-cols-6 gap-2">
              {colors_preset.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`group relative h-10 rounded-lg transition-all duration-300 overflow-hidden border-2 ${
                    color === c ? 'ring-2 ring-offset-2 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ 
                    backgroundColor: c,
                    borderColor: color === c ? c : 'transparent',
                    ringColor: c
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px rgba(255,255,255,0.3)` }}
                  ></div>
                </button>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasReminder"
              checked={hasReminder}
              onChange={(e) => setHasReminder(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="hasReminder" className={`text-sm font-bold ${colors.textPrimary} cursor-pointer`}>
              Set Reminder (15 minutes before)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={creating}
              className={`group relative flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} border border-transparent ${colors.shadowCard} hover:${colors.shadowHover} disabled:opacity-50`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
              ></div>
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="relative z-10 font-bold">Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative z-10 font-bold">Create Intent</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${colors.textMuted} hover:${colors.textPrimary}`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}