// ===== app/(Dashboard)/dept-head/components/CalendarView.tsx =====
'use client';

import React from 'react';
import PersonalCalendar from '@/app/components/calendars/PersonalCalendar';

/**
 * CalendarView Component
 * 
 * Wrapper component for the PersonalCalendar that can be used across all role dashboards.
 * This component provides a consistent interface for calendar functionality across:
 * - Employee Dashboard
 * - HR Employee Dashboard
 * - Department Head Dashboard
 * - HR Head Dashboard
 * - Admin Dashboard
 * 
 * Features:
 * - Personal calendar management with Time Intents
 * - Day Canvas for planning and reflection
 * - Day Health computation and visualization
 * - Event creation and editing
 * - System-generated events (appointments, deadlines, etc.)
 * - Auto-completion of expired events
 * - Time slot availability checking
 * - Theme-aware styling with character-based colors
 * - Distinct visualization for past, present, and future days
 * 
 * ARDA Time Module Features:
 * - Time Intents: scheduled events, task blocks, deadlines, focus/recovery blocks, reminders
 * - Day Canvas: freeform date-bound space for text, checklists, mood tracking, reflection
 * - Day Health: qualitative measure of workload (Light, Balanced, Heavy, Overloaded)
 * - Today Control Center: daily overview with stats and upcoming intents
 * - Calendar Grid: month view with health indicators and event previews
 */
export default function CalendarView() {
  return (
    <div className="w-full h-full">
      <PersonalCalendar />
    </div>
  );
}