// ===== app/components/appointments/AppointmentCard.tsx =====
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Calendar, Clock, User, Users, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';

interface Participant {
  userId: string;
  username: string;
  name: string;
  status: 'pending' | 'accepted' | 'declined' | 'counter-proposed';
  responseDate?: Date;
  declineReason?: string;
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
  createdAt: Date;
}

interface AppointmentCardProps {
  appointment: Appointment;
  currentUsername: string;
  onViewDetails: (appointment: Appointment) => void;
}

export default function AppointmentCard({ appointment, currentUsername, onViewDetails }: AppointmentCardProps) {
  const { colors, cardCharacters } = useTheme();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          character: cardCharacters.interactive,
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          label: 'Pending'
        };
      case 'accepted':
        return {
          character: cardCharacters.completed,
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          label: 'Accepted'
        };
      case 'declined':
        return {
          character: cardCharacters.urgent,
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: 'Declined'
        };
      case 'partially-accepted':
        return {
          character: cardCharacters.informative,
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          label: 'Partial'
        };
      default:
        return {
          character: cardCharacters.neutral,
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(appointment.status);
  const cardChar = cardCharacters.neutral;
  
  const isCreator = appointment.creatorUsername === currentUsername;
  const userParticipant = appointment.participants.find(p => p.username === currentUsername);
  const needsResponse = userParticipant && userParticipant.status === 'pending';
  
  const acceptedCount = appointment.participants.filter(p => p.status === 'accepted').length;
  const totalCount = appointment.participants.length;
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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

  return (
    <button
      onClick={() => onViewDetails(appointment)}
      className={`group relative w-full text-left overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardChar.bg} ${cardChar.border} ${colors.shadowCard} hover:${colors.shadowHover} transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
      ></div>

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-black ${cardChar.text} mb-1 line-clamp-1 group-hover:${cardChar.accent} transition-colors`}>
              {appointment.title}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {appointment.type === 'group' ? (
                  <Users className={`h-3 w-3 ${colors.textMuted}`} />
                ) : (
                  <User className={`h-3 w-3 ${colors.textMuted}`} />
                )}
                <span className={`text-xs ${colors.textMuted}`}>
                  {isCreator ? 'Created by you' : `From: ${appointment.creatorName}`}
                </span>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg border backdrop-blur-sm bg-gradient-to-br ${statusConfig.character.bg} ${statusConfig.character.border}`}>
            <div className={statusConfig.character.iconColor}>
              {statusConfig.icon}
            </div>
            <span className={`text-[10px] font-bold ${statusConfig.character.text}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Group Info */}
        {appointment.type === 'group' && (
          <div className={`flex items-center space-x-2 p-2 rounded-lg border backdrop-blur-sm ${cardCharacters.informative.bg} ${cardCharacters.informative.border}`}>
            <Users className={`h-3.5 w-3.5 ${cardCharacters.informative.iconColor}`} />
            <span className={`text-xs font-bold ${cardCharacters.informative.text}`}>
              Group ({acceptedCount}/{totalCount} accepted)
            </span>
          </div>
        )}

        {/* Date and Time */}
        <div className={`p-2 rounded-lg border backdrop-blur-sm ${colors.inputBg} ${colors.inputBorder}`}>
          <div className={`flex items-center space-x-2 text-xs ${colors.textSecondary} mb-1`}>
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium">{formatDate(appointment.proposedDate)}</span>
          </div>
          <div className={`flex items-center space-x-2 text-xs ${colors.textSecondary}`}>
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">
              {formatTime(appointment.proposedStartTime)} - {formatTime(appointment.proposedEndTime)}
            </span>
          </div>
        </div>

        {/* Description Preview */}
        {appointment.description && (
          <p className={`text-xs ${colors.textMuted} line-clamp-2`}>
            {appointment.description}
          </p>
        )}

        {/* Action Needed Badge */}
        {needsResponse && (
          <div className={`flex items-center justify-between pt-3 border-t ${colors.border}`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse`} 
                   style={{ backgroundColor: cardCharacters.urgent.iconColor.replace('text-', '') }}></div>
              <span className={`text-xs font-bold ${cardCharacters.urgent.text}`}>
                Response Required
              </span>
            </div>
            <span className={`text-[10px] ${colors.textMuted}`}>
              Click to respond
            </span>
          </div>
        )}

        {/* Footer Info */}
        <div className={`flex items-center justify-between text-[10px] ${colors.textMuted} pt-2 border-t ${colors.borderSubtle}`}>
          <span>Created {new Date(appointment.createdAt).toLocaleDateString()}</span>
          {appointment.type === 'group' && (
            <span>{totalCount} participants</span>
          )}
        </div>
      </div>
    </button>
  );
}