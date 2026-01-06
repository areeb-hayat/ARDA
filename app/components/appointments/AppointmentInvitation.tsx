// ===== app/components/appointments/AppointmentInvitation.tsx =====
// NOTE: This component is kept for backward compatibility with individual appointments
// The new system uses AppointmentDetails.tsx which handles both individual and group appointments
// You can safely use AppointmentDetails.tsx instead of this component

'use client';

import React from 'react';
import AppointmentDetails from './AppointmentDetails';

interface Appointment {
  _id: string;
  requesterUsername?: string;
  requestedUsername?: string;
  creatorUsername?: string;
  creatorName?: string;
  type?: 'individual' | 'group';
  participants?: any[];
  title: string;
  description?: string;
  proposedDate: Date;
  proposedStartTime: string;
  proposedEndTime: string;
  status: 'pending' | 'accepted' | 'declined' | 'counter-proposed' | 'partially-accepted' | 'cancelled';
  currentOwner?: string;
  counterProposal?: {
    date: Date;
    startTime: string;
    endTime: string;
    reason: string;
  };
  declineReason?: string;
  history: Array<{
    action: string;
    by: string;
    byName?: string;
    timestamp: Date;
    details?: any;
  }>;
}

interface AppointmentInvitationProps {
  appointment: Appointment;
  currentUsername: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Legacy wrapper component for backward compatibility
 * Converts old appointment format to new format and renders AppointmentDetails
 */
export default function AppointmentInvitation({ 
  appointment, 
  currentUsername, 
  onClose, 
  onSuccess 
}: AppointmentInvitationProps) {
  // Convert old format to new format if needed
  const normalizedAppointment = {
    ...appointment,
    creatorUsername: appointment.creatorUsername || appointment.requesterUsername || '',
    creatorName: appointment.creatorName || appointment.requesterUsername || '',
    type: appointment.type || 'individual' as const,
    participants: appointment.participants || (
      appointment.requestedUsername ? [{
        userId: appointment.requestedUsername,
        username: appointment.requestedUsername,
        name: appointment.requestedUsername,
        status: appointment.status || 'pending',
        responseDate: undefined,
        declineReason: appointment.declineReason
      }] : []
    )
  };

  // Use the new AppointmentDetails component
  return (
    <AppointmentDetails
      appointment={normalizedAppointment as any}
      currentUsername={currentUsername}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}