// ===== app/components/appointments/AppointmentDetails.tsx =====
'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { X, CheckCircle, XCircle, Clock, Calendar, User, Users, FileText, Lock, MessageSquare, AlertCircle, Trash2 } from 'lucide-react';

interface Participant {
  userId: string;
  username: string;
  name: string;
  status: 'pending' | 'accepted' | 'declined' | 'counter-proposed';
  responseDate?: Date;
  declineReason?: string;
  counterProposal?: {
    date: Date;
    startTime: string;
    endTime: string;
    reason: string;
  };
}

interface Appointment {
  _id: string;
  creatorUsername: string;
  creatorName: string;
  type: 'individual' | 'group';
  participants: Participant[];
  title: string;
  description?: string;
  proposedDate: Date;
  proposedStartTime: string;
  proposedEndTime: string;
  status: 'pending' | 'accepted' | 'declined' | 'partially-accepted' | 'cancelled';
  history: Array<{
    action: string;
    by: string;
    byName?: string;
    timestamp: Date;
    details?: any;
  }>;
}

interface AppointmentDetailsProps {
  appointment: Appointment;
  currentUsername: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppointmentDetails({ appointment, currentUsername, onClose, onSuccess }: AppointmentDetailsProps) {
  const { colors, cardCharacters, theme } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [action, setAction] = useState<'accept' | 'decline' | 'counter' | 'lock-appointment' | 'cancel-meeting' | null>(null);
  const [loading, setLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  
  // Counter proposal state
  const [counterProposal, setCounterProposal] = useState({
    date: new Date(appointment.proposedDate).toISOString().split('T')[0],
    startHour: appointment.proposedStartTime.split(':')[0],
    startMinute: appointment.proposedStartTime.split(':')[1],
    duration: 2,
    reason: ''
  });

  const isCreator = appointment.creatorUsername === currentUsername;
  const userParticipant = appointment.participants.find(p => p.username === currentUsername);
  const canRespond = userParticipant && userParticipant.status === 'pending';

  // Stats
  const acceptedParticipants = appointment.participants.filter(p => p.status === 'accepted');
  const declinedParticipants = appointment.participants.filter(p => p.status === 'declined');
  const pendingParticipants = appointment.participants.filter(p => p.status === 'pending');
  const hasAccepted = acceptedParticipants.length > 0;
  const hasDeclined = declinedParticipants.length > 0;

  // Duration options
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

  const handleResponse = async () => {
    if (!action) return;

    try {
      setLoading(true);
      const body: any = { username: currentUsername };

      if (action === 'decline') {
        body.action = 'decline';
        body.reason = declineReason;
      } else if (action === 'counter') {
        const startTime = `${counterProposal.startHour}:${counterProposal.startMinute}`;
        const endTime = calculateEndTime(counterProposal.startHour, counterProposal.startMinute, counterProposal.duration);
        
        body.action = 'counter-propose';
        body.counterProposal = {
          date: counterProposal.date,
          startTime,
          endTime,
          reason: counterProposal.reason
        };
      } else if (action === 'accept') {
        body.action = 'accept';
      } else if (action === 'lock-appointment') {
        body.action = 'lock-appointment';
      } else if (action === 'cancel-meeting') {
        body.action = 'cancel-meeting';
        body.reason = cancelReason;
      }

      const response = await fetch(`/api/appointments/${appointment._id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to respond to appointment');
      }
    } catch (error) {
      console.error('Failed to respond:', error);
      alert('Failed to respond to appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { char: cardCharacters.interactive, label: 'Pending' },
      accepted: { char: cardCharacters.completed, label: 'Accepted' },
      declined: { char: cardCharacters.urgent, label: 'Declined' },
      'counter-proposed': { char: cardCharacters.informative, label: 'Counter-Proposed' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${colors.modalOverlay} animate-fadeIn`}>
      <div 
        className={`relative overflow-hidden rounded-xl border w-full max-w-4xl max-h-[95vh] overflow-y-auto ${colors.modalBg} ${colors.modalBorder} ${colors.modalShadow} animate-modalSlideIn`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.scrollbarThumb} ${colors.scrollbarTrack}`
        }}
      >
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

        {/* Header */}
        <div className={`sticky top-0 z-10 border-b ${colors.modalBorder} ${colors.modalHeaderBg} p-5`}>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                {appointment.type === 'group' ? (
                  <Users className={`h-5 w-5 ${charColors.iconColor}`} />
                ) : (
                  <Calendar className={`h-5 w-5 ${charColors.iconColor}`} />
                )}
              </div>
              <div>
                <h2 className={`text-lg font-black ${colors.modalHeaderText}`}>Appointment Details</h2>
                <p className={`text-xs ${colors.textMuted}`}>
                  {canRespond ? 'Review and respond' : isCreator ? 'Manage appointment' : 'Appointment information'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`group relative p-2 rounded-lg transition-all duration-300 overflow-hidden border ${charColors.border} ${charColors.bg}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}></div>
              <X className={`h-5 w-5 relative z-10 ${charColors.iconColor} transition-transform duration-300 group-hover:rotate-90`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6 space-y-4">
          {/* Creator Lock Notice */}
          {isCreator && hasAccepted && appointment.status !== 'accepted' && appointment.status !== 'cancelled' && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border}`}>
              <div className="flex items-center space-x-2 mb-2">
                <Lock className={`h-5 w-5 ${cardCharacters.completed.iconColor}`} />
                <h4 className={`text-sm font-black ${cardCharacters.completed.text}`}>Ready to Lock Meeting?</h4>
              </div>
              <p className={`text-sm ${colors.textSecondary} mb-3`}>
                {acceptedParticipants.length} of {appointment.participants.length} participants have accepted. 
                You can lock the meeting now with available participants or wait for more responses.
              </p>
              <button
                onClick={() => setAction('lock-appointment')}
                className={`text-sm font-bold ${cardCharacters.completed.text} hover:underline flex items-center gap-2`}
              >
                <Lock className="h-4 w-4" />
                Lock with {acceptedParticipants.length} participant(s)
              </button>
            </div>
          )}

          {/* Declined Participants Notice */}
          {hasDeclined && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border}`}>
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className={`h-4 w-4 ${cardCharacters.urgent.iconColor}`} />
                <h4 className={`text-sm font-black ${cardCharacters.urgent.text}`}>
                  {declinedParticipants.length} Participant(s) Declined
                </h4>
              </div>
              <div className="space-y-1">
                {declinedParticipants.map(p => (
                  <p key={p.userId} className={`text-xs ${colors.textSecondary}`}>
                    • {p.name}: {p.declineReason}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Appointment Info */}
          <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.border} space-y-4`}>
            <div>
              <h3 className={`text-xl font-black ${colors.textPrimary} mb-2`}>{appointment.title}</h3>
              {appointment.description && <p className={`text-sm ${colors.textSecondary}`}>{appointment.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border ${colors.inputBg} ${colors.inputBorder}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <User className={`h-4 w-4 ${colors.textMuted}`} />
                  <span className={`text-xs font-bold ${colors.textSecondary}`}>Organizer</span>
                </div>
                <p className={`text-sm font-bold ${colors.textPrimary}`}>{appointment.creatorName}</p>
              </div>

              <div className={`p-3 rounded-lg border ${colors.inputBg} ${colors.inputBorder}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className={`h-4 w-4 ${colors.textMuted}`} />
                  <span className={`text-xs font-bold ${colors.textSecondary}`}>Date</span>
                </div>
                <p className={`text-sm font-bold ${colors.textPrimary}`}>{formatDate(appointment.proposedDate)}</p>
              </div>

              <div className={`p-3 rounded-lg border ${colors.inputBg} ${colors.inputBorder}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className={`h-4 w-4 ${colors.textMuted}`} />
                  <span className={`text-xs font-bold ${colors.textSecondary}`}>Time</span>
                </div>
                <p className={`text-sm font-bold ${colors.textPrimary}`}>
                  {formatTime(appointment.proposedStartTime)} - {formatTime(appointment.proposedEndTime)}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${colors.inputBg} ${colors.inputBorder}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className={`h-4 w-4 ${colors.textMuted}`} />
                  <span className={`text-xs font-bold ${colors.textSecondary}`}>Status</span>
                </div>
                <p className={`text-sm font-bold capitalize ${colors.textPrimary}`}>
                  {appointment.status.replace('-', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Participants */}
          {appointment.type === 'group' && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border}`}>
              <h4 className={`text-sm font-black ${cardCharacters.informative.text} mb-3 flex items-center space-x-2`}>
                <Users className="h-4 w-4" />
                <span>Participants ({appointment.participants.length})</span>
              </h4>
              <div className="space-y-2">
                {appointment.participants.map((p) => {
                  const statusConfig = getStatusConfig(p.status);
                  return (
                    <div key={p.userId} className={`p-3 rounded-lg border backdrop-blur-sm ${colors.inputBg} ${colors.inputBorder}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-bold ${colors.textPrimary}`}>{p.name}</p>
                          <p className={`text-xs ${colors.textMuted}`}>@{p.username}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-lg border backdrop-blur-sm bg-gradient-to-br ${statusConfig.char.bg} ${statusConfig.char.border}`}>
                          <span className={`text-xs font-bold ${statusConfig.char.text}`}>{statusConfig.label}</span>
                        </div>
                      </div>
                      {p.declineReason && (
                        <p className={`text-xs ${colors.textMuted} mt-2`}>Reason: {p.declineReason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Response Actions for Participants */}
          {canRespond && !action && (
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setAction('accept')}
                className={`group relative flex flex-col items-center space-y-2 p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border} transition-all duration-300`}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowSuccess}` }}
                ></div>
                <CheckCircle className={`h-6 w-6 relative z-10 ${cardCharacters.completed.iconColor}`} />
                <span className={`text-sm font-bold relative z-10 ${cardCharacters.completed.text}`}>Accept</span>
              </button>

              <button
                onClick={() => setAction('counter')}
                className={`group relative flex flex-col items-center space-y-2 p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} transition-all duration-300`}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                ></div>
                <Clock className={`h-6 w-6 relative z-10 ${cardCharacters.informative.iconColor}`} />
                <span className={`text-sm font-bold relative z-10 ${cardCharacters.informative.text}`}>Propose New Time</span>
              </button>

              <button
                onClick={() => setAction('decline')}
                className={`group relative flex flex-col items-center space-y-2 p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} transition-all duration-300`}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowWarning}` }}
                ></div>
                <XCircle className={`h-6 w-6 relative z-10 ${cardCharacters.urgent.iconColor}`} />
                <span className={`text-sm font-bold relative z-10 ${cardCharacters.urgent.text}`}>Decline</span>
              </button>
            </div>
          )}

          {/* Creator Actions */}
          {isCreator && appointment.status !== 'accepted' && appointment.status !== 'cancelled' && !action && (
            <div className="grid grid-cols-2 gap-3">
              {hasAccepted && (
                <button
                  onClick={() => setAction('lock-appointment')}
                  className={`group relative flex flex-col items-center space-y-2 p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border} transition-all duration-300`}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 20px ${colors.glowSuccess}` }}
                  ></div>
                  <Lock className={`h-6 w-6 relative z-10 ${cardCharacters.completed.iconColor}`} />
                  <span className={`text-sm font-bold relative z-10 ${cardCharacters.completed.text}`}>
                    Lock Meeting ({acceptedParticipants.length})
                  </span>
                </button>
              )}

              <button
                onClick={() => setAction('cancel-meeting')}
                className={`group relative flex flex-col items-center space-y-2 p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} transition-all duration-300`}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowWarning}` }}
                ></div>
                <Trash2 className={`h-6 w-6 relative z-10 ${cardCharacters.urgent.iconColor}`} />
                <span className={`text-sm font-bold relative z-10 ${cardCharacters.urgent.text}`}>Cancel Meeting</span>
              </button>
            </div>
          )}

          {/* Decline Form */}
          {action === 'decline' && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} space-y-3`}>
              <h4 className={`text-sm font-black ${cardCharacters.urgent.text}`}>Decline Appointment</h4>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded-lg text-sm ${colors.inputText} focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none`}
                rows={3}
                placeholder="Please provide a reason..."
              />
              <div className="flex space-x-2">
                <button onClick={() => setAction(null)} className={`flex-1 px-4 py-2 border ${colors.border} rounded-lg font-bold ${colors.textSecondary} transition-all hover:${colors.textPrimary}`}>
                  Cancel
                </button>
                <button onClick={handleResponse} disabled={loading || !declineReason.trim()}
                  className={`group relative flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-300 overflow-hidden bg-gradient-to-r ${cardCharacters.urgent.bg} border ${cardCharacters.urgent.border} ${cardCharacters.urgent.text} disabled:opacity-50`}>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowWarning}` }}
                  ></div>
                  <span className="relative z-10">{loading ? 'Declining...' : 'Confirm Decline'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Cancel Meeting Form */}
          {action === 'cancel-meeting' && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} space-y-3`}>
              <h4 className={`text-sm font-black ${cardCharacters.urgent.text}`}>Cancel Meeting</h4>
              <p className={`text-sm ${colors.textSecondary}`}>This will cancel the meeting for all participants.</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded-lg text-sm ${colors.inputText} focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none`}
                rows={2}
                placeholder="Reason for cancellation (optional)..."
              />
              <div className="flex space-x-2">
                <button onClick={() => setAction(null)} className={`flex-1 px-4 py-2 border ${colors.border} rounded-lg font-bold ${colors.textSecondary} transition-all hover:${colors.textPrimary}`}>
                  Back
                </button>
                <button onClick={handleResponse} disabled={loading}
                  className={`group relative flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-300 overflow-hidden bg-gradient-to-r ${cardCharacters.urgent.bg} border ${cardCharacters.urgent.border} ${cardCharacters.urgent.text} disabled:opacity-50`}>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowWarning}` }}
                  ></div>
                  <span className="relative z-10">{loading ? 'Cancelling...' : 'Confirm Cancel'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Lock Appointment Confirmation */}
          {action === 'lock-appointment' && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border} space-y-3`}>
              <h4 className={`text-sm font-black ${cardCharacters.completed.text} flex items-center gap-2`}>
                <Lock className="h-4 w-4" />
                Lock Meeting with Available Participants
              </h4>
              <p className={`text-sm ${colors.textSecondary}`}>
                This will confirm the meeting with {acceptedParticipants.length} accepted participant(s). 
                Pending and declined participants will be removed. Calendar events will be created for all confirmed attendees.
              </p>
              <div className="flex space-x-2">
                <button onClick={() => setAction(null)} className={`flex-1 px-4 py-2 border ${colors.border} rounded-lg font-bold ${colors.textSecondary} transition-all hover:${colors.textPrimary}`}>
                  Back
                </button>
                <button onClick={handleResponse} disabled={loading}
                  className={`group relative flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-300 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50`}>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowSuccess}, inset 0 0 28px ${colors.glowSuccess}` }}
                  ></div>
                  <span className="relative z-10">{loading ? 'Locking...' : `Lock with ${acceptedParticipants.length}`}</span>
                </button>
              </div>
            </div>
          )}

          {/* Counter Form */}
          {action === 'counter' && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} space-y-3`}>
              <h4 className={`text-sm font-black ${cardCharacters.informative.text}`}>Propose New Time</h4>
              <div className={`p-3 rounded-lg ${colors.inputBg} border ${colors.inputBorder}`}>
                <p className={`text-xs ${colors.textMuted} flex items-center gap-2`}>
                  <AlertCircle className="h-4 w-4" />
                  <span>⚠️ <strong>Note:</strong> You will become the new organizer. All participants (including those who already accepted) will need to respond again.</span>
                </p>
              </div>
              
              {/* Date */}
              <div>
                <label className={`block text-xs font-bold ${colors.textSecondary} mb-1`}>Date</label>
                <input
                  type="date"
                  value={counterProposal.date}
                  onChange={(e) => setCounterProposal({ ...counterProposal, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-2 py-1.5 ${colors.inputBg} border ${colors.inputBorder} rounded-lg text-sm ${colors.inputText} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className={`text-xs font-bold ${colors.textSecondary} mb-1 block flex items-center gap-2`}>
                  <Clock className="w-3 h-3" />
                  Start Time
                </label>
                <div className="flex gap-2">
                  <select
                    value={counterProposal.startHour}
                    onChange={(e) => setCounterProposal({ ...counterProposal, startHour: e.target.value })}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} appearance-none cursor-pointer focus:ring-2 focus:ring-opacity-50`}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = String(i).padStart(2, '0');
                      const displayHour = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
                      return <option key={hour} value={hour}>{displayHour}</option>;
                    })}
                  </select>
                  <select
                    value={counterProposal.startMinute}
                    onChange={(e) => setCounterProposal({ ...counterProposal, startMinute: e.target.value })}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} appearance-none cursor-pointer focus:ring-2 focus:ring-opacity-50`}
                  >
                    <option value="00">00</option>
                    <option value="30">30</option>
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className={`text-xs font-bold ${colors.textSecondary} mb-1 block`}>Duration</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {quickDurations.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCounterProposal({ ...counterProposal, duration: opt.value })}
                      className={`group relative p-1.5 rounded-lg text-xs font-bold transition-all duration-300 overflow-hidden ${
                        counterProposal.duration === opt.value
                          ? `${cardCharacters.informative.bg} ${cardCharacters.informative.text} border-2 ${cardCharacters.informative.border}`
                          : `${colors.inputBg} ${colors.textMuted} border ${colors.inputBorder}`
                      }`}
                    >
                      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                      <span className="relative z-10">{opt.label}</span>
                    </button>
                  ))}
                </div>

                <select
                  value={counterProposal.duration > 4 ? counterProposal.duration : ''}
                  onChange={(e) => setCounterProposal({ ...counterProposal, duration: parseInt(e.target.value) })}
                  className={`w-full px-2 py-1.5 rounded-lg text-xs ${colors.inputBg} border ${colors.inputBorder} ${colors.textMuted} appearance-none cursor-pointer focus:ring-2 focus:ring-opacity-50`}
                >
                  <option value="">More than 2 hours...</option>
                  {extendedDurations.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <p className={`text-xs ${colors.textMuted} mt-1 flex items-center gap-1`}>
                  <Clock className="w-3 h-3" />
                  Ends at: {new Date(`2000-01-01T${calculateEndTime(counterProposal.startHour, counterProposal.startMinute, counterProposal.duration)}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>

              <textarea
                value={counterProposal.reason}
                onChange={(e) => setCounterProposal({ ...counterProposal, reason: e.target.value })}
                className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded-lg text-sm ${colors.inputText} focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none`}
                rows={2}
                placeholder="Explain why you're proposing these changes..."
                required
              />

              <div className="flex space-x-2">
                <button onClick={() => setAction(null)} className={`flex-1 px-4 py-2 border ${colors.border} rounded-lg font-bold ${colors.textSecondary} transition-all hover:${colors.textPrimary}`}>
                  Cancel
                </button>
                <button onClick={handleResponse} disabled={loading || !counterProposal.reason.trim()}
                  className={`group relative flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-300 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50`}>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
                  ></div>
                  <span className="relative z-10">{loading ? 'Sending...' : 'Send Proposal'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Accept Confirmation */}
          {action === 'accept' && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border} space-y-3`}>
              <h4 className={`text-sm font-black ${cardCharacters.completed.text}`}>Accept Appointment</h4>
              <p className={`text-sm ${colors.textSecondary}`}>
                This will mark your attendance. The organizer can lock the meeting when ready.
              </p>
              <div className="flex space-x-2">
                <button onClick={() => setAction(null)} className={`flex-1 px-4 py-2 border ${colors.border} rounded-lg font-bold ${colors.textSecondary} transition-all hover:${colors.textPrimary}`}>
                  Cancel
                </button>
                <button onClick={handleResponse} disabled={loading}
                  className={`group relative flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-300 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50`}>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowSuccess}, inset 0 0 28px ${colors.glowSuccess}` }}
                  ></div>
                  <span className="relative z-10">{loading ? 'Accepting...' : 'Confirm Accept'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}