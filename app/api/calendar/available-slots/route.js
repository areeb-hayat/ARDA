// ===== app/api/calendar/available-slots/route.js =====
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { TimeIntent } from '@/models/CalendarEvent';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '30');

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'User ID and date are required' },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(9, 0, 0, 0); // Start at 9 AM

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(18, 0, 0, 0); // End at 6 PM

    // Fetch all events for the day
    const events = await TimeIntent.find({
      userId,
      isCompleted: false,
      startTime: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).sort({ startTime: 1 });

    // Generate time slots
    const slots = [];
    let currentTime = new Date(startOfDay);

    while (currentTime < endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);

      if (slotEnd > endOfDay) break;

      // Check if slot conflicts with any event
      const hasConflict = events.some(event => {
        return (
          currentTime < new Date(event.endTime) &&
          slotEnd > new Date(event.startTime)
        );
      });

      if (!hasConflict) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd)
        });
      }

      currentTime = new Date(currentTime.getTime() + duration * 60000);
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}