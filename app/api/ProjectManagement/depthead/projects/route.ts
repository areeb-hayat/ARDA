// app/api/ProjectManagement/depthead/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Project from '@/models/ProjectManagement/Project';
import FormData from '@/models/FormData';
import { sendProjectNotification } from '@/app/utils/projectNotifications';
import { TimeIntent } from '@/models/CalendarEvent';

// Helper to calculate health
function calculateHealth(project: any): string {
  const now = new Date();
  let hasOverdue = false;
  let hasBlockers = false;
  let isNearDeadline = false;

  project.deliverables?.forEach((d: any) => {
    if (d.status !== 'done' && d.dueDate && new Date(d.dueDate) < now) {
      hasOverdue = true;
    }
    if (d.blockers?.some((b: any) => !b.isResolved)) {
      hasBlockers = true;
    }
    if (d.dueDate) {
      const daysUntilDue = Math.ceil((new Date(d.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 3 && daysUntilDue >= 0 && d.status !== 'done') {
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

// GET - Fetch all projects for department
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department parameter is required' },
        { status: 400 }
      );
    }

    const query: any = { department };
    if (status && status !== 'all') {
      query.status = status;
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });

    // Calculate health for each project
    projects.forEach(project => {
      project.health = calculateHealth(project);
    });

    await Promise.all(projects.map(p => p.save()));

    return NextResponse.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { 
      title, 
      description, 
      department, 
      createdBy, 
      createdByName,
      members,
      groupLead,
      startDate,
      targetEndDate 
    } = body;

    if (!title || !description || !department || !createdBy || !members || !groupLead) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate project number
    const lastProject = await Project.findOne({ department })
      .sort({ createdAt: -1 });
    
    let projectNumber;
    if (lastProject && lastProject.projectNumber) {
      const lastNum = parseInt(lastProject.projectNumber.split('-')[1]);
      projectNumber = `PRJ-${String(lastNum + 1).padStart(4, '0')}`;
    } else {
      projectNumber = 'PRJ-0001';
    }

    const project = new Project({
      projectNumber,
      title,
      description,
      department,
      createdBy,
      createdByName,
      members: members.map((m: any) => ({
        ...m,
        joinedAt: new Date()
      })),
      groupLead,
      startDate: new Date(startDate),
      targetEndDate: targetEndDate ? new Date(targetEndDate) : undefined,
      status: 'active',
      deliverables: [],
      chat: [],
      health: 'healthy'
    });

    await project.save();

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
        // Create project start event
        await createCalendarEvent({
          userId: userId,
          type: 'reminder',
          title: `Project Start: ${title}`,
          description: `${projectNumber} - ${description}`,
          startTime: new Date(startDate),
          endTime: new Date(startDate),
          priority: 'medium',
          linkedProjectId: project._id.toString(),
          color: '#4CAF50'
        });

        // Create project end/deadline event if targetEndDate exists
        if (targetEndDate) {
          await createCalendarEvent({
            userId: userId,
            type: 'deadline',
            title: `Project Deadline: ${title}`,
            description: `${projectNumber} - ${description}`,
            startTime: new Date(targetEndDate),
            endTime: new Date(targetEndDate),
            priority: 'high',
            linkedProjectId: project._id.toString(),
            color: '#F44336'
          });
        }
      } catch (err) {
        console.error(`Calendar sync error for user ${userId}:`, err);
      }
    });

    await Promise.allSettled(calendarSyncPromises);

    // Send notifications (don't let notification failure break project creation)
    try {
      await sendProjectNotification(
        project,
        'created',
        createdBy,
        createdByName
      );
    } catch (notifError) {
      console.error('Failed to send project notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}