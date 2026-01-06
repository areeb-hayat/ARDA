// ===== app/components/appointments/AppointmentRequest.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { X, Send, Search, Calendar, Clock, User, AlertCircle, Users, CheckCircle, XCircle } from 'lucide-react';

interface AppointmentRequestProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface UserOption {
  username: string;
  displayName: string;
  department: string;
  title: string;
  employeeId?: string;
}

interface AvailabilityCheck {
  userId: string;
  username: string;
  name: string;
  available: boolean;
  conflicts?: Array<{
    title: string;
    startTime: Date;
    endTime: Date;
  }>;
}

export default function AppointmentRequest({ onClose, onSuccess }: AppointmentRequestProps) {
  const { colors, cardCharacters, theme } = useTheme();
  const charColors = cardCharacters.creative;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResults, setAvailabilityResults] = useState<AvailabilityCheck[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposedDate: new Date().toISOString().split('T')[0],
    startHour: '09',
    startMinute: '00',
    duration: 2, // Duration in 30-minute blocks
    type: 'individual' as 'individual' | 'group'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Duration options (30-min blocks)
  const quickDurations = [
    { value: 1, label: '30 min' },
    { value: 2, label: '1 hr' },
    { value: 3, label: '1.5 hrs' },
    { value: 4, label: '2 hrs' }
  ];

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery);
      } else {
        setUsers([]);
        setShowUserDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    try {
      setSearching(true);
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      
      const response = await fetch(
        `/api/appointments/users?search=${encodeURIComponent(query)}&currentUsername=${user.username}`
      );
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setShowUserDropdown(data.users.length > 0);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearching(false);
    }
  };

  const addUser = (user: UserOption) => {
    if (!selectedUsers.find(u => u.username === user.username)) {
      const newSelectedUsers = [...selectedUsers, user];
      setSelectedUsers(newSelectedUsers);
      setFormData(prev => ({
        ...prev,
        type: newSelectedUsers.length > 1 ? 'group' : 'individual'
      }));
      setAvailabilityResults([]);
    }
    setSearchQuery('');
    setShowUserDropdown(false);
    setErrors({ ...errors, users: '' });
  };

  const removeUser = (username: string) => {
    const newSelectedUsers = selectedUsers.filter(u => u.username !== username);
    setSelectedUsers(newSelectedUsers);
    setFormData(prev => ({
      ...prev,
      type: newSelectedUsers.length > 1 ? 'group' : 'individual'
    }));
    setAvailabilityResults([]);
  };

  const checkAvailability = async () => {
    if (selectedUsers.length === 0 || !formData.proposedDate) return;

    try {
      setCheckingAvailability(true);
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const allUserIds = [user.username, ...selectedUsers.map(u => u.username)];
      const startTime = `${formData.startHour}:${formData.startMinute}`;
      const endTime = calculateEndTime(formData.startHour, formData.startMinute, formData.duration);

      const response = await fetch('/api/calendar/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: allUserIds,
          date: formData.proposedDate,
          startTime,
          endTime
        })
      });

      const data = await response.json();
      setAvailabilityResults(data.availabilityResults || []);
    } catch (error) {
      console.error('Failed to check availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (formData.proposedDate && selectedUsers.length > 0) {
      checkAvailability();
    }
  }, [formData.proposedDate, formData.startHour, formData.startMinute, formData.duration, selectedUsers]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (selectedUsers.length === 0) {
      newErrors.users = 'Please select at least one participant';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.proposedDate) {
      newErrors.date = 'Date is required';
    }

    const selectedDate = new Date(formData.proposedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      newErrors.date = 'Cannot schedule appointments in the past';
    }

    const unavailable = availabilityResults.filter(r => !r.available);
    if (unavailable.length > 0) {
      newErrors.availability = `${unavailable.map(u => u.name).join(', ')} ${
        unavailable.length === 1 ? 'is' : 'are'
      } not available at this time`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (!userData || selectedUsers.length === 0) return;

      const user = JSON.parse(userData);
      const startTime = `${formData.startHour}:${formData.startMinute}`;
      const endTime = calculateEndTime(formData.startHour, formData.startMinute, formData.duration);

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: user.username,
          creatorUsername: user.username,
          creatorName: user.name || user.username,
          type: formData.type,
          participantUsernames: selectedUsers.map(u => u.username),
          title: formData.title,
          description: formData.description,
          proposedDate: formData.proposedDate,
          proposedStartTime: startTime,
          proposedEndTime: endTime
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setErrors({ submit: responseData.error || 'Failed to create appointment' });
      }
    } catch (error) {
      console.error('Failed to create appointment:', error);
      setErrors({ submit: 'Failed to create appointment' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${colors.modalOverlay} animate-fadeIn`}>
      <div 
        className={`relative w-full max-w-3xl max-h-[95vh] overflow-hidden rounded-xl border ${colors.modalBg} ${colors.modalBorder} ${colors.modalShadow} animate-modalSlideIn`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

        {/* Header */}
        <div className={`relative border-b ${colors.modalBorder} ${colors.modalHeaderBg} p-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                {formData.type === 'group' ? (
                  <Users className={`w-5 h-5 ${charColors.iconColor}`} />
                ) : (
                  <Calendar className={`w-5 h-5 ${charColors.iconColor}`} />
                )}
              </div>
              <div>
                <h2 className={`text-xl font-black ${colors.modalHeaderText}`}>
                  Create {formData.type === 'group' ? 'Group' : ''} Appointment
                </h2>
                <p className={`text-xs ${colors.textMuted}`}>
                  {formData.type === 'group' 
                    ? 'Schedule a meeting with multiple participants'
                    : 'Schedule a meeting with another user'
                  }
                </p>
              </div>
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
          
          {/* User Selection */}
          <div className="relative">
            <label className={`block text-xs font-bold ${colors.textSecondary} mb-2 uppercase`}>
              Select Participants *
            </label>
            
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${colors.textMuted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (users.length > 0) setShowUserDropdown(true); }}
                onBlur={() => { setTimeout(() => setShowUserDropdown(false), 200); }}
                className={`w-full pl-10 pr-3 py-2 ${colors.inputBg} border ${errors.users ? cardCharacters.urgent.border : colors.inputBorder} rounded-lg text-sm ${colors.inputText} ${colors.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all`}
                placeholder="Search by name, username, or employee ID..."
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin`} 
                       style={{ borderColor: charColors.iconColor.replace('text-', '') }}></div>
                </div>
              )}
              
              {showUserDropdown && users.length > 0 && (
                <div 
                  className={`absolute z-20 w-full mt-1 rounded-lg border shadow-2xl max-h-60 overflow-y-auto ${colors.dropdownBg} ${colors.dropdownBorder} dropdown-animate`}
                >
                  {users.map((user) => (
                    <button
                      key={user.username}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addUser(user);
                      }}
                      className={`w-full text-left p-3 border-b ${colors.borderSubtle} last:border-b-0 transition-all duration-300 ${colors.dropdownHover}`}
                      disabled={selectedUsers.some(u => u.username === user.username)}
                    >
                      <div className={`font-bold text-sm ${colors.textPrimary}`}>
                        {user.displayName}
                      </div>
                      <div className={`text-xs ${colors.textMuted}`}>
                        @{user.username} {user.employeeId && `• ID: ${user.employeeId}`}
                      </div>
                      <div className={`text-xs ${colors.textMuted}`}>
                        {user.department} • {user.title}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {errors.users && (
              <p className={`text-xs mt-1 flex items-center space-x-1 ${cardCharacters.urgent.text}`}>
                <AlertCircle className="h-3 w-3" />
                <span>{errors.users}</span>
              </p>
            )}

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className={`text-xs font-bold ${colors.textSecondary}`}>
                  Selected Participants ({selectedUsers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div 
                      key={user.username}
                      className={`flex items-center space-x-2 px-3 py-1.5 ${colors.inputBg} border ${colors.inputBorder} rounded-lg`}
                    >
                      <User className={`h-3.5 w-3.5 ${charColors.iconColor}`} />
                      <span className={`text-xs font-medium ${colors.textPrimary}`}>
                        {user.displayName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeUser(user.username)}
                        className={`p-0.5 rounded transition-all hover:bg-opacity-70`}
                      >
                        <X className={`h-3.5 w-3.5 ${colors.textMuted} hover:${cardCharacters.urgent.iconColor}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className={`block text-xs font-bold ${colors.textSecondary} mb-1`}>
              Meeting Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 ${colors.inputBg} border ${errors.title ? cardCharacters.urgent.border : colors.inputBorder} rounded-lg text-sm ${colors.inputText} ${colors.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all`}
              placeholder="e.g., Project Discussion, Weekly Sync"
            />
            {errors.title && (
              <p className={`text-xs mt-1 flex items-center space-x-1 ${cardCharacters.urgent.text}`}>
                <AlertCircle className="h-3 w-3" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={`block text-xs font-bold ${colors.textSecondary} mb-1`}>
              Description / Agenda
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded-lg text-sm ${colors.inputText} ${colors.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all resize-none`}
              rows={3}
              placeholder="Add meeting agenda or additional details..."
            />
          </div>

          {/* Date */}
          <div>
            <label className={`block text-xs font-bold ${colors.textSecondary} mb-1`}>Date *</label>
            <input
              type="date"
              value={formData.proposedDate}
              onChange={(e) => setFormData({ ...formData, proposedDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 ${colors.inputBg} border ${errors.date ? cardCharacters.urgent.border : colors.inputBorder} rounded-lg text-sm ${colors.inputText} focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all`}
            />
            {errors.date && (
              <p className={`text-xs mt-1 ${cardCharacters.urgent.text}`}>{errors.date}</p>
            )}
          </div>

          {/* Time Selection - Matching EventCreator */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-1 block flex items-center gap-2`}>
              <Clock className="w-3 h-3" />
              Start Time
            </label>
            <div className="flex gap-2">
              <select
                value={formData.startHour}
                onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} focus:ring-2 focus:ring-opacity-50 transition-all appearance-none cursor-pointer`}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = String(i).padStart(2, '0');
                  const displayHour = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
                  return <option key={hour} value={hour}>{displayHour}</option>;
                })}
              </select>
              <select
                value={formData.startMinute}
                onChange={(e) => setFormData({ ...formData, startMinute: e.target.value })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} focus:ring-2 focus:ring-opacity-50 transition-all appearance-none cursor-pointer`}
              >
                <option value="00">00</option>
                <option value="30">30</option>
              </select>
            </div>
          </div>

          {/* Duration - Matching EventCreator */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-2 block`}>Duration</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {quickDurations.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, duration: opt.value })}
                  className={`group relative p-2.5 rounded-lg text-xs font-bold transition-all duration-300 overflow-hidden ${
                    formData.duration === opt.value
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
              value={formData.duration > 4 ? formData.duration : ''}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${colors.inputBg} border ${colors.inputBorder} ${colors.textMuted} focus:ring-2 focus:ring-opacity-50 transition-all appearance-none cursor-pointer`}
            >
              <option value="">More than 2 hours...</option>
              {extendedDurations.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <p className={`text-xs ${colors.textMuted} mt-2 flex items-center gap-1`}>
              <Clock className="w-3 h-3" />
              Ends at: {new Date(`2000-01-01T${calculateEndTime(formData.startHour, formData.startMinute, formData.duration)}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>

          {/* Availability Check Results */}
          {checkingAvailability && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border}`}>
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin`}
                     style={{ borderColor: cardCharacters.informative.iconColor.replace('text-', '') }}></div>
                <p className={`text-sm ${cardCharacters.informative.text}`}>
                  Checking availability...
                </p>
              </div>
            </div>
          )}

          {!checkingAvailability && availabilityResults.length > 0 && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${
              availabilityResults.every(r => r.available) 
                ? cardCharacters.completed.bg 
                : cardCharacters.urgent.bg
            } ${
              availabilityResults.every(r => r.available)
                ? cardCharacters.completed.border
                : cardCharacters.urgent.border
            }`}>
              <div className="flex items-center space-x-2 mb-3">
                {availabilityResults.every(r => r.available) ? (
                  <>
                    <CheckCircle className={`h-5 w-5 ${cardCharacters.completed.iconColor}`} />
                    <h4 className={`text-sm font-black ${cardCharacters.completed.text}`}>
                      All Participants Available
                    </h4>
                  </>
                ) : (
                  <>
                    <XCircle className={`h-5 w-5 ${cardCharacters.urgent.iconColor}`} />
                    <h4 className={`text-sm font-black ${cardCharacters.urgent.text}`}>
                      Some Participants Unavailable
                    </h4>
                  </>
                )}
              </div>
              
              <div className="space-y-2">
                {availabilityResults.map((result) => (
                  <div 
                    key={result.userId}
                    className={`p-3 rounded-lg border backdrop-blur-sm ${
                      result.available 
                        ? `${colors.inputBg} ${colors.inputBorder}`
                        : `${cardCharacters.urgent.bg} ${cardCharacters.urgent.border}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <User className={`h-3.5 w-3.5 ${
                          result.available 
                            ? colors.textMuted 
                            : cardCharacters.urgent.iconColor
                        }`} />
                        <span className={`text-sm font-bold ${colors.textPrimary}`}>
                          {result.name}
                        </span>
                      </div>
                      {result.available ? (
                        <CheckCircle className={`h-4 w-4 ${cardCharacters.completed.iconColor}`} />
                      ) : (
                        <XCircle className={`h-4 w-4 ${cardCharacters.urgent.iconColor}`} />
                      )}
                    </div>
                    
                    {!result.available && result.conflicts && result.conflicts.length > 0 && (
                      <div className={`mt-2 text-xs ${colors.textMuted}`}>
                        <p className="font-medium mb-1">Conflicts:</p>
                        {result.conflicts.map((conflict, idx) => (
                          <div key={idx} className="ml-2">
                            • {conflict.title} ({new Date(conflict.startTime).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })} - {new Date(conflict.endTime).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {errors.availability && (
                <p className={`text-xs mt-3 flex items-center space-x-1 ${cardCharacters.urgent.text}`}>
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.availability}</span>
                </p>
              )}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className={`p-3 rounded-lg border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} flex items-center space-x-2`}>
              <AlertCircle className={`h-4 w-4 ${cardCharacters.urgent.iconColor}`} />
              <p className={`text-xs ${cardCharacters.urgent.text}`}>{errors.submit}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`group relative flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} border border-transparent ${colors.shadowCard} hover:${colors.shadowHover} disabled:opacity-50`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
              ></div>
              {loading ? (
                <>
                  <div className={`w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10`}></div>
                  <span className="relative z-10 font-bold">Creating...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative z-10 font-bold">Create Appointment</span>
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