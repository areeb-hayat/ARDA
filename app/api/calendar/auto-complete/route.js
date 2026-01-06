// ===== app/api/calendar/auto-complete/route.js =====
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { TimeIntent } from '@/models/CalendarEvent';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Find all expired events that should be auto-completed
    const expiredEvents = await TimeIntent.find({
      userId,
      autoCompleteOnExpiry: true,
      isCompleted: false,
      endTime: { $lt: now }
    });

    // Update all expired events
    const updatePromises = expiredEvents.map(event => {
      event.isCompleted = true;
      event.completedAt = event.endTime;
      return event.save();
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Auto-completed expired events',
      completedCount: expiredEvents.length,
      completedEvents: expiredEvents.map(e => ({
        id: e._id,
        title: e.title,
        type: e.type
      }))
    });
  } catch (error) {
    console.error('Error auto-completing events:', error);
    return NextResponse.json(
      { error: 'Failed to auto-complete events' },
      { status: 500 }
    );
  }
}