// ===== app/api/calendar/events/route.js =====
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { TimeIntent } from '@/models/CalendarEvent';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build query
    const query = { userId };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const events = await TimeIntent.find(query).sort({ startTime: 1 });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      userId,
      type,
      title,
      description,
      startTime,
      endTime,
      allDay,
      priority,
      color,
      reminderMinutesBefore,
      hasReminder,
      location,
      attendees,
      createdBy,
      isRecurring,
      recurringPattern,
    } = body;

    if (!userId || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for conflicts (only for time-based events)
    if (startTime && endTime && type !== 'deadline') {
      const conflicts = await TimeIntent.find({
        userId,
        isCompleted: false,
        $or: [
          {
            startTime: { $lt: new Date(endTime) },
            endTime: { $gt: new Date(startTime) }
          }
        ]
      });

      if (conflicts.length > 0) {
        return NextResponse.json(
          { 
            error: 'Time slot conflict detected',
            conflicts: conflicts.map(c => ({
              id: c._id,
              title: c.title,
              startTime: c.startTime,
              endTime: c.endTime
            }))
          },
          { status: 409 }
        );
      }
    }

    const event = new TimeIntent({
      userId,
      type,
      title,
      description,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      allDay: allDay || false,
      priority: priority || 'medium',
      color: color || '#2196F3',
      reminderMinutesBefore: reminderMinutesBefore || 15,
      hasReminder: hasReminder !== undefined ? hasReminder : true,
      location,
      attendees,
      createdBy,
      isRecurring: isRecurring || false,
      recurringPattern,
    });

    await event.save();

    return NextResponse.json(
      { message: 'Event created successfully', event },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { eventId, updates } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const event = await TimeIntent.findById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // ✅ FIXED: Allow completion toggling on system-generated events
    // Only block OTHER modifications to system events
    const isCompletionToggle = 
      Object.keys(updates).length === 1 && 
      updates.hasOwnProperty('isCompleted');

    if (event.isSystemGenerated && !isCompletionToggle) {
      return NextResponse.json(
        { error: 'System-generated events cannot be modified (except completion status)' },
        { status: 403 }
      );
    }

    // Check for conflicts if updating time (only for non-system events)
    if ((updates.startTime || updates.endTime) && !event.isSystemGenerated) {
      const startTime = updates.startTime ? new Date(updates.startTime) : event.startTime;
      const endTime = updates.endTime ? new Date(updates.endTime) : event.endTime;

      const conflicts = await TimeIntent.find({
        _id: { $ne: eventId },
        userId: event.userId,
        isCompleted: false,
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: 'Time slot conflict detected' },
          { status: 409 }
        );
      }
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key === 'startTime' || key === 'endTime') {
        event[key] = new Date(updates[key]);
      } else {
        event[key] = updates[key];
      }
    });

    // Handle completion timestamp
    if (updates.isCompleted === true && !event.completedAt) {
      event.completedAt = new Date();
    } else if (updates.isCompleted === false) {
      event.completedAt = null;
    }

    await event.save();

    return NextResponse.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const event = await TimeIntent.findById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of system-generated events
    if (event.isSystemGenerated) {
      return NextResponse.json(
        { error: 'System-generated events cannot be deleted. Please cancel the associated appointment/task instead.' },
        { status: 403 }
      );
    }

    await TimeIntent.findByIdAndDelete(eventId);

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}