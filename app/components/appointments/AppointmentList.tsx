// ===== app/components/appointments/AppointmentList.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Calendar, Plus, ArrowLeft, RefreshCw, Filter } from 'lucide-react';
import AppointmentCard from './AppointmentCard';
import AppointmentRequest from './AppointmentRequest';
import AppointmentDetails from './AppointmentDetails';

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
  history: Array<{
    action: string;
    by: string;
    byName?: string;
    timestamp: Date;
    details?: any;
  }>;
  createdAt: Date;
}

type StatusFilter = 'all' | 'pending' | 'accepted' | 'declined' | 'partially-accepted';

interface AppointmentListProps {
  onBack?: () => void;
}

export default function AppointmentList({ onBack }: AppointmentListProps) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      
      const response = await fetch(`/api/appointments?username=${user.username}&view=all`);
      const data = await response.json();

      if (data.success) {
        const formatted = data.appointments.map((apt: any) => ({
          ...apt,
          proposedDate: new Date(apt.proposedDate)
        }));

        setAppointments(formatted);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const categorizeAppointments = () => {
    const userData = localStorage.getItem('user');
    if (!userData) return { needResponse: [], waiting: [], upcoming: [], past: [] };
    
    const user = JSON.parse(userData);
    const now = new Date();

    // Need Response: User is participant and their status is pending
    const needResponse = appointments.filter(apt => {
      // Skip cancelled appointments
      if (apt.status === 'cancelled') return false;
      
      const participant = apt.participants.find(p => p.username === user.username);
      return participant && participant.status === 'pending';
    });

    // Waiting: User is creator and appointment is not fully accepted/declined/cancelled
    const waiting = appointments.filter(apt => {
      // Must be creator
      if (apt.creatorUsername !== user.username) return false;
      
      // Skip if user is also a participant who hasn't responded
      const userParticipant = apt.participants.find(p => p.username === user.username);
      if (userParticipant && userParticipant.status === 'pending') return false;
      
      // Include if status is pending or partially-accepted
      // This covers: waiting for all to respond, or some accepted but not all
      return apt.status === 'pending' || apt.status === 'partially-accepted';
    });

    // Upcoming: Appointment is accepted and in the future
    const upcoming = appointments.filter(apt => {
      if (apt.status !== 'accepted') return false;
      
      const appointmentDate = new Date(apt.proposedDate);
      const [hours, minutes] = apt.proposedEndTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return appointmentDate >= now;
    });

    // Past: Completed, cancelled, declined, or past date
    const past = appointments.filter(apt => {
      // Cancelled or declined
      if (apt.status === 'cancelled' || apt.status === 'declined') return true;
      
      // Accepted but past
      if (apt.status === 'accepted') {
        const appointmentDate = new Date(apt.proposedDate);
        const [hours, minutes] = apt.proposedEndTime.split(':');
        appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return appointmentDate < now;
      }
      
      return false;
    });

    return { needResponse, waiting, upcoming, past };
  };

  const filterByStatus = (apts: Appointment[]) => {
    if (statusFilter === 'all') return apts;
    return apts.filter(apt => apt.status === statusFilter);
  };

  const { needResponse, waiting, upcoming, past } = categorizeAppointments();

  const userData = localStorage.getItem('user');
  const currentUsername = userData ? JSON.parse(userData).username : '';

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <button
                  onClick={handleBack}
                  className={`group relative flex items-center justify-center p-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${charColors.border} backdrop-blur-sm ${colors.shadowCard} hover:${colors.shadowHover}`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                  ></div>
                  <ArrowLeft className={`h-5 w-5 relative z-10 transition-transform duration-300 group-hover:-translate-x-1 ${charColors.iconColor}`} />
                </button>
              )}

              <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg}`}>
                <Calendar className={`h-5 w-5 ${charColors.iconColor}`} />
              </div>
              <div>
                <h1 className={`text-xl font-black ${charColors.text}`}>Appointments</h1>
                <p className={`text-xs ${colors.textMuted}`}>
                  {appointments.length} total • {needResponse.length} need response • {waiting.length} waiting • {upcoming.length} upcoming
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowRequestModal(true)}
              className={`group relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} border border-transparent ${colors.shadowCard} hover:${colors.shadowHover}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
              ></div>
              <Plus className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:rotate-90" />
              <span className="text-sm font-bold relative z-10">New Appointment</span>
            </button>
          </div>

          {/* Filters */}
          <div className={`p-3 rounded-lg border ${charColors.border} bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm`}>
            <div className="flex items-center space-x-2 mb-2">
              <Filter className={`h-4 w-4 ${colors.textMuted}`} />
              <span className={`text-xs font-bold ${colors.textSecondary}`}>Filter by status:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'accepted', 'partially-accepted', 'declined'] as StatusFilter[]).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    statusFilter === status
                      ? `bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`
                      : `${colors.inputBg} ${colors.textSecondary} hover:${colors.textPrimary}`
                  }`}
                >
                  {status === 'partially-accepted' ? 'Partial' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} p-12 ${colors.shadowCard}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto`} 
                   style={{ borderColor: charColors.iconColor.replace('text-', '') }}></div>
              <p className={`${colors.textMuted} text-sm`}>Loading appointments...</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Action Required Section */}
          {needResponse.length > 0 && (
            <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} ${colors.shadowCard}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <h2 className={`text-lg font-black ${cardCharacters.urgent.text}`}>
                      Action Required ({needResponse.length})
                    </h2>
                  </div>
                  <RefreshCw 
                    onClick={fetchAppointments}
                    className={`h-4 w-4 cursor-pointer transition-transform hover:rotate-180 ${cardCharacters.urgent.iconColor}`} 
                  />
                </div>
                <p className={`text-xs ${colors.textMuted} mb-4`}>
                  These appointments need your response
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterByStatus(needResponse).map(appointment => (
                    <AppointmentCard
                      key={appointment._id}
                      appointment={appointment}
                      currentUsername={currentUsername}
                      onViewDetails={setSelectedAppointment}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Waiting for Response Section */}
          {waiting.length > 0 && (
            <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.interactive.bg} ${cardCharacters.interactive.border} ${colors.shadowCard}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-black ${cardCharacters.interactive.text}`}>
                    Waiting for Response ({waiting.length})
                  </h2>
                  <RefreshCw 
                    onClick={fetchAppointments}
                    className={`h-4 w-4 cursor-pointer transition-transform hover:rotate-180 ${cardCharacters.interactive.iconColor}`} 
                  />
                </div>
                <p className={`text-xs ${colors.textMuted} mb-4`}>
                  Appointments you created awaiting participant responses
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterByStatus(waiting).map(appointment => {
                    const acceptedCount = appointment.participants.filter(p => p.status === 'accepted').length;
                    const totalCount = appointment.participants.length;
                    const hasPartialAcceptance = acceptedCount > 0 && acceptedCount < totalCount;
                    
                    return (
                      <div key={appointment._id} className="relative">
                        {hasPartialAcceptance && (
                          <div className={`absolute -top-2 -right-2 z-10 px-2 py-1 rounded-full text-xs font-bold ${cardCharacters.informative.bg} ${cardCharacters.informative.border} border`}>
                            {acceptedCount}/{totalCount} ✓
                          </div>
                        )}
                        <AppointmentCard
                          appointment={appointment}
                          currentUsername={currentUsername}
                          onViewDetails={setSelectedAppointment}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          {upcoming.length > 0 && (
            <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border} ${colors.shadowCard}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-black ${cardCharacters.completed.text}`}>
                    Upcoming Meetings ({upcoming.length})
                  </h2>
                  <RefreshCw 
                    onClick={fetchAppointments}
                    className={`h-4 w-4 cursor-pointer transition-transform hover:rotate-180 ${cardCharacters.completed.iconColor}`} 
                  />
                </div>
                <p className={`text-xs ${colors.textMuted} mb-4`}>
                  Confirmed appointments
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterByStatus(upcoming).map(appointment => (
                    <AppointmentCard
                      key={appointment._id}
                      appointment={appointment}
                      currentUsername={currentUsername}
                      onViewDetails={setSelectedAppointment}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Past Section */}
          {past.length > 0 && (
            <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.neutral.bg} ${cardCharacters.neutral.border} ${colors.shadowCard}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-black ${cardCharacters.neutral.text}`}>
                    History ({past.length})
                  </h2>
                  <RefreshCw 
                    onClick={fetchAppointments}
                    className={`h-4 w-4 cursor-pointer transition-transform hover:rotate-180 ${cardCharacters.neutral.iconColor}`} 
                  />
                </div>
                <p className={`text-xs ${colors.textMuted} mb-4`}>
                  Past, cancelled, and declined appointments
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterByStatus(past).map(appointment => (
                    <AppointmentCard
                      key={appointment._id}
                      appointment={appointment}
                      currentUsername={currentUsername}
                      onViewDetails={setSelectedAppointment}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {appointments.length === 0 && (
            <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} p-12 ${colors.shadowCard} text-center`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <div className="relative">
                <div className={`p-4 bg-gradient-to-r ${charColors.bg} rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                  <Calendar className={`h-8 w-8 ${charColors.iconColor}`} />
                </div>
                <h3 className={`text-lg font-black ${charColors.text} mb-2`}>
                  No Appointments Yet
                </h3>
                <p className={`text-sm ${colors.textMuted} mb-4`}>
                  Start by creating your first appointment
                </p>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className={`group relative inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} border border-transparent ${colors.shadowCard} hover:${colors.shadowHover}`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
                  ></div>
                  <Plus className="h-4 w-4 relative z-10" />
                  <span className="text-sm font-bold relative z-10">Create Appointment</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <AppointmentRequest
          onClose={() => setShowRequestModal(false)}
          onSuccess={fetchAppointments}
        />
      )}

      {/* Details Modal */}
      {selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          currentUsername={currentUsername}
          onClose={() => setSelectedAppointment(null)}
          onSuccess={fetchAppointments}
        />
      )}
    </div>
  );
}