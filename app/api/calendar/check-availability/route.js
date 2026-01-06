// ===== app/api/calendar/check-availability/route.js =====
import dbConnect from '@/lib/mongoose';
import { TimeIntent } from '@/models/CalendarEvent';
import FormData from '@/models/FormData';

/**
 * POST /api/calendar/check-availability
 * Check if multiple users are available at a specific time
 * 
 * IMPORTANT: Converts usernames to FormData._id for TimeIntent.userId queries
 * 
 * Request Body:
 * - userIds: Array of usernames (will be converted to FormData._id)
 * - date: ISO date string
 * - startTime: "HH:MM" format
 * - endTime: "HH:MM" format
 * 
 * Returns:
 * - allAvailable: boolean
 * - availabilityResults: Array of user availability with conflicts
 * - unavailableUsers: Array of users with conflicts
 */
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userIds, date, startTime, endTime } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ error: 'userIds array is required' }, { status: 400 });
    }

    if (!date || !startTime || !endTime) {
      return Response.json({ error: 'date, startTime, and endTime are required' }, { status: 400 });
    }

    // Convert usernames to FormData._id for TimeIntent queries
    const userDataList = await FormData.find({ 
      username: { $in: userIds } 
    }).select('_id username basicDetails.name').lean();

    if (userDataList.length === 0) {
      return Response.json({ error: 'No users found' }, { status: 404 });
    }

    // Create a map of username -> { formDataId, name }
    const usernameToDataMap = new Map(
      userDataList.map(u => [
        u.username, 
        { 
          formDataId: u._id.toString(), // FormData._id for TimeIntent.userId
          name: u.basicDetails?.name || u.username 
        }
      ])
    );

    // Parse the date and times
    const targetDate = new Date(date);
    const [startHours, startMinutes] = startTime.split(':');
    const [endHours, endMinutes] = endTime.split(':');

    // Create start and end datetime objects
    const proposedStart = new Date(targetDate);
    proposedStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

    const proposedEnd = new Date(targetDate);
    proposedEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

    // Set date range for the day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check availability for each user
    const availabilityResults = [];

    for (const username of userIds) {
      const userData = usernameToDataMap.get(username);
      
      if (!userData) {
        // User not found in FormData
        availabilityResults.push({
          userId: username,
          username: username,
          name: username,
          available: false,
          conflicts: [{
            title: 'User not found',
            startTime: proposedStart,
            endTime: proposedEnd
          }]
        });
        continue;
      }

      // Query TimeIntent using FormData._id (stored in userId field)
      const existingEvents = await TimeIntent.find({
        userId: userData.formDataId, // Use FormData._id
        startTime: { $lt: endOfDay },
        endTime: { $gt: startOfDay }
      }).select('title startTime endTime type').lean();

      // Check for conflicts
      const conflicts = existingEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);

        // Check if events overlap
        return (
          (eventStart < proposedEnd && eventEnd > proposedStart) ||
          (proposedStart < eventEnd && proposedEnd > eventStart)
        );
      });

      availabilityResults.push({
        userId: userData.formDataId,
        username: username,
        name: userData.name,
        available: conflicts.length === 0,
        conflicts: conflicts.map(c => ({
          title: c.title,
          startTime: c.startTime,
          endTime: c.endTime,
          type: c.type
        }))
      });
    }

    // Determine if all users are available
    const allAvailable = availabilityResults.every(r => r.available);

    // Get list of unavailable users
    const unavailableUsers = availabilityResults.filter(r => !r.available);

    return Response.json({
      success: true,
      allAvailable,
      availabilityResults,
      unavailableUsers
    });

  } catch (error) {
    console.error('Availability check error:', error);
    return Response.json({ 
      error: error.message || 'Failed to check availability' 
    }, { status: 500 });
  }
}