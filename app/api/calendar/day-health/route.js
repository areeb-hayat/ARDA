// ===== app/api/calendar/day-health/route.js =====
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { DayHealthMetrics, TimeIntent } from '@/models/CalendarEvent';

function calculateDayHealth(metrics) {
  const {
    totalHours,
    meetingHours,
    deadlineCount,
    highPriorityCount,
    recoveryHours
  } = metrics;

  // Calculate cognitive load score (0-100)
  let loadScore = 0;

  // Hours contribution (max 40 points)
  if (totalHours > 10) loadScore += 40;
  else if (totalHours > 8) loadScore += 30;
  else if (totalHours > 6) loadScore += 20;
  else if (totalHours > 4) loadScore += 10;

  // Meeting hours contribution (max 20 points)
  if (meetingHours > 6) loadScore += 20;
  else if (meetingHours > 4) loadScore += 15;
  else if (meetingHours > 2) loadScore += 10;
  else if (meetingHours > 1) loadScore += 5;

  // Deadlines contribution (max 20 points)
  if (deadlineCount > 3) loadScore += 20;
  else if (deadlineCount > 2) loadScore += 15;
  else if (deadlineCount > 1) loadScore += 10;
  else if (deadlineCount > 0) loadScore += 5;

  // High priority items contribution (max 20 points)
  if (highPriorityCount > 3) loadScore += 20;
  else if (highPriorityCount > 2) loadScore += 15;
  else if (highPriorityCount > 1) loadScore += 10;
  else if (highPriorityCount > 0) loadScore += 5;

  // Recovery hours reduce the load
  loadScore = Math.max(0, loadScore - (recoveryHours * 5));

  // Determine health status
  if (loadScore >= 70) return 'overloaded';
  if (loadScore >= 45) return 'heavy';
  if (loadScore >= 20) return 'balanced';
  return 'light';
}

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'User ID and date are required' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch events for the day
    const events = await TimeIntent.find({
      userId,
      startTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Calculate metrics
    let totalHours = 0;
    let meetingHours = 0;
    let focusHours = 0;
    let recoveryHours = 0;
    let deadlineCount = 0;
    let highPriorityCount = 0;

    events.forEach(event => {
      if (event.type === 'deadline') {
        deadlineCount++;
      } else if (event.startTime && event.endTime) {
        const hours = (event.endTime - event.startTime) / (1000 * 60 * 60);
        totalHours += hours;

        if (event.type === 'meeting' || event.type === 'appointment') {
          meetingHours += hours;
        } else if (event.type === 'focus-block') {
          focusHours += hours;
        } else if (event.type === 'recovery-block') {
          recoveryHours += hours;
        }
      }

      if (event.priority === 'high' || event.priority === 'urgent') {
        highPriorityCount++;
      }
    });

    const metrics = {
      totalEvents: events.length,
      totalHours,
      meetingHours,
      focusHours,
      deadlineCount,
      highPriorityCount,
      recoveryHours
    };

    const healthStatus = calculateDayHealth(metrics);

    // Update or create health metrics
    let dayHealth = await DayHealthMetrics.findOne({
      userId,
      date: startOfDay
    });

    if (dayHealth) {
      dayHealth.healthStatus = healthStatus;
      dayHealth.metrics = metrics;
      dayHealth.computedAt = new Date();
    } else {
      dayHealth = new DayHealthMetrics({
        userId,
        date: startOfDay,
        healthStatus,
        metrics,
        computedAt: new Date()
      });
    }

    await dayHealth.save();

    return NextResponse.json({ dayHealth, events });
  } catch (error) {
    console.error('Error calculating day health:', error);
    return NextResponse.json(
      { error: 'Failed to calculate day health' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, startDate, endDate } = body;

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'User ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const results = [];

    // Calculate health for each day in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const events = await TimeIntent.find({
        userId,
        startTime: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });

      let totalHours = 0;
      let meetingHours = 0;
      let focusHours = 0;
      let recoveryHours = 0;
      let deadlineCount = 0;
      let highPriorityCount = 0;

      events.forEach(event => {
        if (event.type === 'deadline') {
          deadlineCount++;
        } else if (event.startTime && event.endTime) {
          const hours = (event.endTime - event.startTime) / (1000 * 60 * 60);
          totalHours += hours;

          if (event.type === 'meeting' || event.type === 'appointment') {
            meetingHours += hours;
          } else if (event.type === 'focus-block') {
            focusHours += hours;
          } else if (event.type === 'recovery-block') {
            recoveryHours += hours;
          }
        }

        if (event.priority === 'high' || event.priority === 'urgent') {
          highPriorityCount++;
        }
      });

      const metrics = {
        totalEvents: events.length,
        totalHours,
        meetingHours,
        focusHours,
        deadlineCount,
        highPriorityCount,
        recoveryHours
      };

      const healthStatus = calculateDayHealth(metrics);

      let dayHealth = await DayHealthMetrics.findOne({
        userId,
        date: startOfDay
      });

      if (dayHealth) {
        dayHealth.healthStatus = healthStatus;
        dayHealth.metrics = metrics;
        dayHealth.computedAt = new Date();
      } else {
        dayHealth = new DayHealthMetrics({
          userId,
          date: startOfDay,
          healthStatus,
          metrics,
          computedAt: new Date()
        });
      }

      await dayHealth.save();
      results.push(dayHealth);
    }

    return NextResponse.json({
      message: 'Day health calculated for date range',
      results
    });
  } catch (error) {
    console.error('Error batch calculating day health:', error);
    return NextResponse.json(
      { error: 'Failed to calculate day health' },
      { status: 500 }
    );
  }
}