// app/api/ProjectManagement/depthead/sprints/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Sprint from '@/models/ProjectManagement/Sprint';
import FormData from '@/models/FormData';
import { sendSprintNotification } from '@/app/utils/projectNotifications';
import { TimeIntent } from '@/models/CalendarEvent';

// Helper to calculate health
function calculateHealth(sprint: any): string {
  const now = new Date();
  let hasOverdue = false;
  let hasBlockers = false;
  let isNearDeadline = false;

  sprint.actions?.forEach((a: any) => {
    if (a.status !== 'done' && a.dueDate && new Date(a.dueDate) < now) {
      hasOverdue = true;
    }
    if (a.blockers?.some((b: any) => !b.isResolved)) {
      hasBlockers = true;
    }
    if (a.dueDate) {
      const daysUntilDue = Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 3 && daysUntilDue >= 0 && a.status !== 'done') {
        isNearDeadline = true;
      }
    }
  });

  if (hasOverdue && hasBlockers) return 'critical';
  if (hasOverdue) return 'delayed';
  if (hasBlockers || isNearDeadline) return 'at-risk';
  return 'healthy';
}

// Helper function to create calendar event directly
async function createCalendarEvent(eventData: any) {
  try {
    const event = new TimeIntent({
      userId: eventData.userId,
      type: eventData.type,
      title: eventData.title,
      description: eventData.description,
      startTime: eventData.startTime ? new Date(eventData.startTime) : undefined,
      endTime: eventData.endTime ? new Date(eventData.endTime) : undefined,
      priority: eventData.priority || 'medium',
      color: eventData.color || '#2196F3',
      linkedProjectId: eventData.linkedProjectId,
      autoCompleteOnExpiry: eventData.autoCompleteOnExpiry || false,
      isSystemGenerated: true,
      createdBy: {
        userId: 'system',
        name: 'System'
      }
    });
    await event.save();
    return { success: true, eventId: event._id.toString() };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { success: false, error: String(error) };
  }
}

// GET - Fetch all sprints for department
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department parameter is required' },
        { status: 400 }
      );
    }

    const query: any = { department };
    if (projectId) {
      query.projectId = projectId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const sprints = await Sprint.find(query).sort({ createdAt: -1 });

    // Calculate health for each sprint
    sprints.forEach(sprint => {
      sprint.health = calculateHealth(sprint);
    });

    await Promise.all(sprints.map(s => s.save()));

    return NextResponse.json({
      success: true,
      sprints
    });
  } catch (error) {
    console.error('Error fetching sprints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sprints' },
      { status: 500 }
    );
  }
}

// POST - Create new sprint
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { 
      title, 
      description, 
      department,
      projectId,
      projectNumber,
      createdBy, 
      createdByName,
      members,
      groupLead,
      startDate,
      endDate,
      defaultAction
    } = body;

    if (!title || !description || !department || !createdBy || !members || !groupLead || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate sprint number
    const lastSprint = await Sprint.findOne({ department })
      .sort({ createdAt: -1 });
    
    let sprintNumber;
    if (lastSprint && lastSprint.sprintNumber) {
      const lastNum = parseInt(lastSprint.sprintNumber.split('-')[1]);
      sprintNumber = `SPR-${String(lastNum + 1).padStart(4, '0')}`;
    } else {
      sprintNumber = 'SPR-0001';
    }

    // Create default action
    const action = {
      title: defaultAction?.title || 'Sprint Kickoff',
      description: defaultAction?.description || 'Initialize sprint and define goals',
      assignedTo: [groupLead],
      status: 'pending',
      dueDate: new Date(endDate),
      attachments: [],
      blockers: [],
      comments: [],
      history: [
        {
          action: 'created',
          performedBy: createdBy,
          performedByName: createdByName,
          timestamp: new Date(),
          details: 'Action created'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const sprint = new Sprint({
      sprintNumber,
      title,
      description,
      department,
      projectId,
      projectNumber,
      createdBy,
      createdByName,
      members: members.map((m: any) => ({
        ...m,
        joinedAt: new Date()
      })),
      groupLead,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'active',
      actions: [action],
      chat: [],
      health: 'healthy'
    });

    await sprint.save();

    // Get all unique user IDs from members
    const memberUserIds = members.map((m: any) => m.userId);
    
    // Get dept head's userId from FormData using createdBy (username)
    const deptHeadUser = await FormData.findOne({ username: createdBy }).select('_id');
    const deptHeadUserId = deptHeadUser ? deptHeadUser._id.toString() : null;
    
    // Combine member userIds and dept head userId
    const allUserIds = deptHeadUserId 
      ? [...new Set([...memberUserIds, deptHeadUserId])]
      : [...new Set(memberUserIds)];
    
    // Create calendar events for all involved users
    const calendarSyncPromises = allUserIds.map(async (userId: string) => {
      try {
        // Create sprint start event
        await createCalendarEvent({
          userId: userId,
          type: 'reminder',
          title: `Sprint Start: ${title}`,
          description: `${sprintNumber} - ${description}`,
          startTime: new Date(startDate),
          endTime: new Date(startDate),
          priority: 'medium',
          linkedProjectId: sprint._id.toString(),
          color: '#9C27B0'
        });

        // Create sprint end event
        await createCalendarEvent({
          userId: userId,
          type: 'deadline',
          title: `Sprint End: ${title}`,
          description: `${sprintNumber} - ${description}`,
          startTime: new Date(endDate),
          endTime: new Date(endDate),
          priority: 'high',
          linkedProjectId: sprint._id.toString(),
          color: '#9C27B0'
        });
      } catch (err) {
        console.error(`Calendar sync error for user ${userId}:`, err);
      }
    });

    await Promise.allSettled(calendarSyncPromises);

    // Send notifications (don't let notification failure break sprint creation)
    try {
      await sendSprintNotification(
        sprint,
        'created',
        createdBy,
        createdByName
      );
    } catch (notifError) {
      console.error('Failed to send sprint notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      sprint
    });
  } catch (error) {
    console.error('Error creating sprint:', error);
    return NextResponse.json(
      { error: 'Failed to create sprint' },
      { status: 500 }
    );
  }
}