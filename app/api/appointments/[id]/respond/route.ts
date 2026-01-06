// ===== app/api/appointments/[id]/respond/route.ts =====
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Appointment from '@/models/Appointment';
import FormData from '@/models/FormData';
import { TimeIntent } from '@/models/CalendarEvent';
import { 
  sendAppointmentConfirmation, 
  sendTimeChangeNotification, 
  sendCancellationNotification,
  sendAppointmentInvitation 
} from '@/app/utils/appointmentNotifications';

/**
 * POST /api/appointments/:id/respond
 * Respond to an appointment invitation - DIRECT TIMEINTENT CREATION
 * 
 * Actions:
 * - accept: Accept the current time (auto-creates events if all accepted)
 * - decline: Decline with reason
 * - counter-propose: Propose new time (becomes new organizer, all reset to pending)
 * - lock-appointment: Creator locks with current accepted participants
 * - cancel-meeting: Cancel entire meeting
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    const { username, action, reason, counterProposal } = body;

    if (!username || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Find appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json({ 
        error: 'Appointment not found' 
      }, { status: 404 });
    }

    // Check if user is creator or participant
    const isCreator = appointment.creatorUsername === username;
    const participantIndex = appointment.participants.findIndex(
      (p: any) => p.username === username
    );

    if (!isCreator && participantIndex === -1) {
      return NextResponse.json({ 
        error: 'You are not authorized to respond to this appointment' 
      }, { status: 403 });
    }

    // Get user's FormData to fetch actual _id for userId field and name
    const userData = await FormData.findOne({ username }).select('_id basicDetails.name').lean();
    if (!userData) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    const userId = userData._id.toString();
    const userName = userData.basicDetails?.name || username;

    // Handle response based on action
    switch (action) {
      case 'accept':
        if (participantIndex === -1) {
          return NextResponse.json({ 
            error: 'Only participants can accept' 
          }, { status: 403 });
        }

        // Update participant status
        appointment.participants[participantIndex].status = 'accepted';
        appointment.participants[participantIndex].responseDate = new Date();

        // Add to history
        appointment.history.push({
          action: 'accepted',
          by: username,
          byName: userName,
          timestamp: new Date()
        });

        // Update overall status
        appointment.updateOverallStatus();

        // Check if all participants accepted (excluding declined ones)
        const activeParticipants = appointment.participants.filter(
          (p: any) => p.status !== 'declined'
        );
        const allActiveAccepted = activeParticipants.every(
          (p: any) => p.status === 'accepted'
        );

        // If all active participants accepted, create calendar events automatically
        if (allActiveAccepted && activeParticipants.length > 0) {
          await createCalendarEventsForAll(appointment, userId, userName);
          
          appointment.status = 'accepted';
          
          await appointment.save();

          // Send confirmation emails to all participants
          const confirmedUsernames = [
            appointment.creatorUsername,
            ...appointment.participants.map((p: any) => p.username)
          ];

          // Send confirmations in background
          Promise.all(
            [...new Set(confirmedUsernames)].map(uname => 
              sendAppointmentConfirmation(appointment, uname)
            )
          ).catch(err => console.error('Email notification error:', err));

          return NextResponse.json({
            success: true,
            appointment,
            message: 'All participants accepted! Meeting confirmed and added to calendars.',
            calendarSynced: true
          });
        }

        await appointment.save();

        return NextResponse.json({
          success: true,
          appointment,
          message: 'Appointment accepted. Waiting for other participants.'
        });

      case 'decline':
        if (participantIndex === -1) {
          return NextResponse.json({ 
            error: 'Only participants can decline' 
          }, { status: 403 });
        }

        if (!reason || !reason.trim()) {
          return NextResponse.json({ 
            error: 'Decline reason is required' 
          }, { status: 400 });
        }

        appointment.participants[participantIndex].status = 'declined';
        appointment.participants[participantIndex].responseDate = new Date();
        appointment.participants[participantIndex].declineReason = reason;

        appointment.history.push({
          action: 'declined',
          by: username,
          byName: userName,
          timestamp: new Date(),
          details: { reason }
        });

        appointment.updateOverallStatus();

        // Check if all participants declined
        const allDeclined = appointment.participants.every(
          (p: any) => p.status === 'declined'
        );

        if (allDeclined) {
          appointment.status = 'cancelled';
          appointment.history.push({
            action: 'cancelled',
            by: 'system',
            byName: 'System',
            timestamp: new Date(),
            details: { reason: 'All participants declined' }
          });
        }

        await appointment.save();

        return NextResponse.json({
          success: true,
          appointment,
          message: allDeclined 
            ? 'All participants declined. Meeting cancelled.' 
            : 'You declined the appointment.'
        });

      case 'counter-propose':
        // ANY participant can counter-propose
        if (participantIndex === -1 && !isCreator) {
          return NextResponse.json({ 
            error: 'Only participants can counter-propose' 
          }, { status: 403 });
        }

        if (!counterProposal || !counterProposal.date || !counterProposal.startTime || 
            !counterProposal.endTime || !counterProposal.reason) {
          return NextResponse.json({ 
            error: 'Complete counter-proposal details are required' 
          }, { status: 400 });
        }

        // CHANGE ORGANIZER: Person proposing becomes new creator
        const oldCreatorUsername = appointment.creatorUsername;
        const oldCreatorName = appointment.creatorName;
        
        appointment.creatorUsername = username;
        appointment.creatorName = userName;
        appointment.creatorId = username;

        // Reset ALL participant statuses to pending (including the new organizer if they were a participant)
        appointment.participants.forEach((p: any) => {
          p.status = 'pending';
          p.responseDate = undefined;
          p.counterProposal = undefined;
          p.declineReason = undefined;
        });

        // If old creator is not already a participant, add them
        const oldCreatorIsParticipant = appointment.participants.some(
          (p: any) => p.username === oldCreatorUsername
        );
        
        if (!oldCreatorIsParticipant) {
          // Get old creator's data
          const oldCreatorData = await FormData.findOne({ username: oldCreatorUsername })
            .select('basicDetails.name')
            .lean();
          
          appointment.participants.push({
            userId: oldCreatorUsername,
            username: oldCreatorUsername,
            name: oldCreatorData?.basicDetails?.name || oldCreatorUsername,
            status: 'pending'
          });
        }

        // Update appointment time to counter-proposal
        appointment.proposedDate = new Date(counterProposal.date);
        appointment.proposedStartTime = counterProposal.startTime;
        appointment.proposedEndTime = counterProposal.endTime;

        appointment.history.push({
          action: 'counter-proposed',
          by: username,
          byName: userName,
          timestamp: new Date(),
          details: { 
            counterProposal,
            oldOrganizer: oldCreatorName,
            newOrganizer: userName,
            message: 'Meeting time changed. All participants need to re-accept.'
          }
        });

        // Delete any existing calendar events - DIRECT deletion
        if (appointment.calendarEventIds && appointment.calendarEventIds.length > 0) {
          const eventIds = appointment.calendarEventIds.map((e: any) => e.eventId);
          await TimeIntent.deleteMany({ _id: { $in: eventIds } });
          appointment.calendarEventIds = [];
        }

        appointment.status = 'pending';

        await appointment.save();

        // Send email notifications to all participants (except the one who proposed changes)
        const allParticipantUsernames = [
          ...appointment.participants.map((p: any) => p.username),
          appointment.creatorUsername
        ].filter(uname => uname !== username); // Exclude the person who made changes

        // Send notifications in background
        Promise.all(
          [...new Set(allParticipantUsernames)].map(uname => 
            sendTimeChangeNotification(appointment, uname, username, userName)
          )
        ).catch(err => console.error('Email notification error:', err));

        return NextResponse.json({
          success: true,
          appointment,
          message: 'Time changed successfully. All participants have been notified to re-accept.'
        });

      case 'lock-appointment':
        // Only current creator can lock the appointment
        if (!isCreator) {
          return NextResponse.json({ 
            error: 'Only the meeting organizer can lock the appointment' 
          }, { status: 403 });
        }

        const acceptedParticipants = appointment.participants.filter(
          (p: any) => p.status === 'accepted'
        );

        if (acceptedParticipants.length === 0) {
          return NextResponse.json({ 
            error: 'No participants have accepted yet' 
          }, { status: 400 });
        }

        // Remove declined and pending participants
        appointment.participants = acceptedParticipants;

        appointment.history.push({
          action: 'locked',
          by: username,
          byName: userName,
          timestamp: new Date(),
          details: { 
            acceptedCount: acceptedParticipants.length,
            message: 'Meeting locked with confirmed participants'
          }
        });

        // Create calendar events for creator and accepted participants
        await createCalendarEventsForAll(appointment, userId, userName);

        appointment.status = 'accepted';

        await appointment.save();

        // Send confirmation emails to all participants
        const confirmedUsernames = [
          appointment.creatorUsername,
          ...appointment.participants.map((p: any) => p.username)
        ];

        // Send confirmations in background
        Promise.all(
          [...new Set(confirmedUsernames)].map(uname => 
            sendAppointmentConfirmation(appointment, uname)
          )
        ).catch(err => console.error('Email notification error:', err));

        return NextResponse.json({
          success: true,
          appointment,
          message: `Meeting confirmed with ${acceptedParticipants.length} participant(s). Calendar events created.`,
          calendarSynced: true
        });

      case 'cancel-meeting':
        // Only creator can cancel the entire meeting
        if (!isCreator) {
          return NextResponse.json({ 
            error: 'Only the meeting organizer can cancel the meeting' 
          }, { status: 403 });
        }

        appointment.status = 'cancelled';

        appointment.history.push({
          action: 'cancelled',
          by: username,
          byName: userName,
          timestamp: new Date(),
          details: { reason: reason || 'Meeting cancelled by organizer' }
        });

        // Delete any existing calendar events - DIRECT deletion
        if (appointment.calendarEventIds && appointment.calendarEventIds.length > 0) {
          const eventIds = appointment.calendarEventIds.map((e: any) => e.eventId);
          await TimeIntent.deleteMany({ _id: { $in: eventIds } });
          appointment.calendarEventIds = [];
        }

        await appointment.save();

        // Send cancellation emails to all participants
        const allUsernames = [
          ...appointment.participants.map((p: any) => p.username)
        ].filter(uname => uname !== username);

        // Send cancellations in background
        Promise.all(
          allUsernames.map(uname => 
            sendCancellationNotification(appointment, uname, username, userName, reason)
          )
        ).catch(err => console.error('Email notification error:', err));

        return NextResponse.json({
          success: true,
          appointment,
          message: 'Meeting cancelled successfully. Calendar events removed.'
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Appointment response error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process response' 
    }, { status: 500 });
  }
}

/**
 * Helper function to create calendar events for all participants
 * USES DIRECT TIMEINTENT CREATION - NOT SYNC API
 */
async function createCalendarEventsForAll(appointment: any, initiatorUserId: string, initiatorName: string) {
  const calendarEvents = [];

  // Get all participant usernames (creator + active participants)
  const allParticipantUsernames = [
    appointment.creatorUsername,
    ...appointment.participants.map((p: any) => p.username)
  ];

  // Get FormData for all participants to fetch their _id
  const allParticipantData = await FormData.find({ 
    username: { $in: allParticipantUsernames } 
  }).select('_id username basicDetails.name').lean();

  // Create a map of username -> FormData document
  const usernameToDataMap = new Map(
    allParticipantData.map((u: any) => [u.username, u])
  );

  // Create start and end datetime
  const appointmentDate = new Date(appointment.proposedDate);
  const [startHours, startMinutes] = appointment.proposedStartTime.split(':');
  const [endHours, endMinutes] = appointment.proposedEndTime.split(':');

  const startDateTime = new Date(appointmentDate);
  startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

  const endDateTime = new Date(appointmentDate);
  endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

  // Create TimeIntent events for all participants - ONE PER USER
  for (const participantUsername of allParticipantUsernames) {
    const participantData = usernameToDataMap.get(participantUsername);
    
    if (!participantData) {
      console.warn(`Could not find FormData for participant: ${participantUsername}`);
      continue;
    }

    const participantUserId = participantData._id.toString();
    const participantName = participantData.basicDetails?.name || participantUsername;

    // Create attendees list (all other participants)
    const attendees = allParticipantUsernames
      .filter(uname => uname !== participantUsername)
      .map(uname => {
        const attendeeData = usernameToDataMap.get(uname);
        return {
          userId: attendeeData?._id.toString() || uname,
          name: attendeeData?.basicDetails?.name || uname,
          status: 'accepted'
        };
      });

    try {
      // ✅ DIRECT CREATION: Check if event already exists for THIS USER and THIS APPOINTMENT
      const existingEvent = await TimeIntent.findOne({
        userId: participantUserId,
        linkedAppointmentId: appointment._id
      });

      if (existingEvent) {
        // Update existing event
        existingEvent.startTime = startDateTime;
        existingEvent.endTime = endDateTime;
        existingEvent.title = appointment.title;
        existingEvent.description = appointment.description || `Meeting organized by ${appointment.creatorName}`;
        existingEvent.attendees = attendees;
        await existingEvent.save();

        calendarEvents.push({
          userId: participantUserId,
          eventId: existingEvent._id
        });

        console.log(`✅ Calendar event updated for ${participantName}`);
      } else {
        // Create new TimeIntent event using FormData._id as userId
        const timeIntent = await TimeIntent.create({
          userId: participantUserId, // FormData._id as string
          type: 'meeting',
          title: appointment.title,
          description: appointment.description || `Meeting organized by ${appointment.creatorName}`,
          startTime: startDateTime,
          endTime: endDateTime,
          allDay: false,
          priority: 'medium',
          color: '#2196F3',
          hasReminder: true,
          reminderMinutesBefore: 15,
          isSystemGenerated: true,
          linkedAppointmentId: appointment._id,
          attendees: attendees,
          createdBy: {
            userId: initiatorUserId,
            name: initiatorName
          }
        });

        calendarEvents.push({
          userId: participantUserId,
          eventId: timeIntent._id
        });

        console.log(`✅ Calendar event created for ${participantName}`);
      }
    } catch (err) {
      console.error(`❌ Error creating calendar event for ${participantName}:`, err);
    }
  }

  // Store calendar event IDs in appointment
  appointment.calendarEventIds = calendarEvents;
}