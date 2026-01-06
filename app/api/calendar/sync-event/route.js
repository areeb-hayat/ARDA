// ===== app/api/calendar/sync-event/route.js =====
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { TimeIntent } from '@/models/CalendarEvent';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      userId,
      userName,
      type,
      title,
      description,
      startTime,
      endTime,
      priority,
      linkedAppointmentId,
      linkedProjectId,
      linkedTaskId,
      autoCompleteOnExpiry,
      color,
      isSystemGenerated
    } = body;

    if (!userId || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if linked event already exists
    let existingEvent = null;
    if (linkedAppointmentId) {
      existingEvent = await TimeIntent.findOne({ linkedAppointmentId });
    } else if (linkedProjectId) {
      existingEvent = await TimeIntent.findOne({ linkedProjectId });
    } else if (linkedTaskId) {
      existingEvent = await TimeIntent.findOne({ linkedTaskId });
    }

    if (existingEvent) {
      // Update existing event
      existingEvent.title = title;
      existingEvent.description = description;
      if (startTime) existingEvent.startTime = new Date(startTime);
      if (endTime) existingEvent.endTime = new Date(endTime);
      existingEvent.priority = priority;
      existingEvent.color = color;
      await existingEvent.save();

      return NextResponse.json({
        message: 'System event updated successfully',
        eventId: existingEvent._id
      });
    }

    // Create new system event
    const event = new TimeIntent({
      userId,
      type,
      title,
      description,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      priority: priority || 'medium',
      color: color || '#2196F3',
      linkedAppointmentId,
      linkedProjectId,
      linkedTaskId,
      autoCompleteOnExpiry: autoCompleteOnExpiry || false,
      isSystemGenerated: isSystemGenerated || true,
      createdBy: {
        userId: 'system',
        name: 'System'
      }
    });

    await event.save();

    return NextResponse.json(
      {
        message: 'System event created successfully',
        eventId: event._id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error syncing system event:', error);
    return NextResponse.json(
      { error: 'Failed to sync event' },
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

    if (!event.isSystemGenerated) {
      return NextResponse.json(
        { error: 'Only system events can be updated through sync' },
        { status: 403 }
      );
    }

    Object.keys(updates).forEach(key => {
      if (key === 'startTime' || key === 'endTime') {
        event[key] = new Date(updates[key]);
      } else {
        event[key] = updates[key];
      }
    });

    await event.save();

    return NextResponse.json({
      message: 'System event updated successfully',
      event
    });
  } catch (error) {
    console.error('Error updating system event:', error);
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

    if (!event.isSystemGenerated) {
      return NextResponse.json(
        { error: 'Only system events can be deleted through sync' },
        { status: 403 }
      );
    }

    await TimeIntent.findByIdAndDelete(eventId);

    return NextResponse.json({ message: 'System event deleted successfully' });
  } catch (error) {
    console.error('Error deleting system event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}