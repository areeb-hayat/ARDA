// ===== app/utils/calendarSync.ts =====

interface SyncEventData {
  userId: string;
  userName: string;
  type: 'meeting' | 'appointment' | 'task-block' | 'deadline' | 'reminder';
  title: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  linkedAppointmentId?: string;
  linkedProjectId?: string;
  linkedTaskId?: string;
  autoCompleteOnExpiry?: boolean;
  color?: string;
}

/**
 * Syncs system-generated events to user calendar
 * These events cannot be deleted by users
 */
export async function syncSystemEvent(eventData: SyncEventData): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const response = await fetch('/api/calendar/sync-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...eventData,
        isSystemGenerated: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sync event');
    }

    return { success: true, eventId: data.eventId };
  } catch (error) {
    console.error('Calendar sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Syncs project deadline to calendar
 */
export async function syncProjectDeadline(projectData: {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  deadline: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}): Promise<{ success: boolean; eventId?: string; error?: string }> {
  return syncSystemEvent({
    userId: projectData.userId,
    userName: projectData.userName,
    type: 'deadline',
    title: `Project Deadline: ${projectData.projectName}`,
    description: `Deadline for project: ${projectData.projectName}`,
    startTime: projectData.deadline,
    endTime: projectData.deadline,
    priority: projectData.priority,
    linkedProjectId: projectData.projectId,
    color: '#F44336',
  });
}

/**
 * Syncs appointment to calendar
 */
export async function syncAppointment(appointmentData: {
  userId: string;
  userName: string;
  appointmentId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}): Promise<{ success: boolean; eventId?: string; error?: string }> {
  return syncSystemEvent({
    userId: appointmentData.userId,
    userName: appointmentData.userName,
    type: 'appointment',
    title: appointmentData.title,
    description: appointmentData.description,
    startTime: appointmentData.startTime,
    endTime: appointmentData.endTime,
    linkedAppointmentId: appointmentData.appointmentId,
    autoCompleteOnExpiry: true,
    color: '#64B5F6',
  });
}

/**
 * Syncs task with time block to calendar
 */
export async function syncTaskBlock(taskData: {
  userId: string;
  userName: string;
  taskId: string;
  taskName: string;
  startTime: Date;
  endTime: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}): Promise<{ success: boolean; eventId?: string; error?: string }> {
  return syncSystemEvent({
    userId: taskData.userId,
    userName: taskData.userName,
    type: 'task-block',
    title: `Task: ${taskData.taskName}`,
    startTime: taskData.startTime,
    endTime: taskData.endTime,
    priority: taskData.priority,
    linkedTaskId: taskData.taskId,
    color: '#FF9800',
  });
}

/**
 * Updates a system-generated event
 */
export async function updateSystemEvent(eventId: string, updates: Partial<SyncEventData>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/calendar/sync-event`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId,
        updates,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update event');
    }

    return { success: true };
  } catch (error) {
    console.error('Calendar update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Deletes a system-generated event
 */
export async function deleteSystemEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/calendar/sync-event?eventId=${eventId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete event');
    }

    return { success: true };
  } catch (error) {
    console.error('Calendar delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Checks if a time slot is available for a user
 */
export async function checkTimeSlotAvailability(
  userId: string,
  startTime: Date,
  endTime: Date
): Promise<{ available: boolean; conflictingEvents?: any[] }> {
  try {
    const response = await fetch(
      `/api/calendar/check-availability?userId=${userId}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check availability');
    }

    return {
      available: data.available,
      conflictingEvents: data.conflictingEvents,
    };
  } catch (error) {
    console.error('Availability check error:', error);
    return {
      available: false,
      conflictingEvents: [],
    };
  }
}

/**
 * Gets all available time slots for a user on a specific date
 */
export async function getAvailableTimeSlots(
  userId: string,
  date: Date,
  slotDuration: number = 30 // in minutes
): Promise<{ success: boolean; slots?: Array<{ start: Date; end: Date }>; error?: string }> {
  try {
    const response = await fetch(
      `/api/calendar/available-slots?userId=${userId}&date=${date.toISOString()}&duration=${slotDuration}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get available slots');
    }

    return {
      success: true,
      slots: data.slots.map((slot: any) => ({
        start: new Date(slot.start),
        end: new Date(slot.end),
      })),
    };
  } catch (error) {
    console.error('Available slots error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Auto-completes expired events
 */
export async function autoCompleteExpiredEvents(userId: string): Promise<{ success: boolean; completedCount?: number; error?: string }> {
  try {
    const response = await fetch('/api/calendar/auto-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to auto-complete events');
    }

    return {
      success: true,
      completedCount: data.completedCount,
    };
  } catch (error) {
    console.error('Auto-complete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}