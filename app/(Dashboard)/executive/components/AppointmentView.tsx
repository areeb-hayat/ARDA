// ===== app/(Dashboard)/hr-head/components/AppointmentView.tsx =====
'use client';

import React from 'react';
import AppointmentList from '@/app/components/appointments/AppointmentList';

/**
 * AppointmentView Component
 * 
 * Wrapper component for the AppointmentList that can be used across all role dashboards.
 * This component provides a consistent interface for appointment functionality across:
 * - Employee Dashboard
 * - HR Employee Dashboard
 * - Department Head Dashboard
 * - HR Head Dashboard
 * - Admin Dashboard
 * 
 * Features:
 * - Send appointment requests to other users
 * - Receive and respond to appointment invitations
 * - Accept, decline, or counter-propose appointments
 * - View upcoming accepted appointments
 * - Track appointment history
 * - Automatic calendar integration when appointments are accepted
 * - Theme-aware styling with neon aesthetics
 */
export default function AppointmentView() {
  return (
    <div className="w-full h-full">
      <AppointmentList />
    </div>
  );
}