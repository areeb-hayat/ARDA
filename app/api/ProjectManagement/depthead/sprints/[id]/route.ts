// app/api/SprintManagement/depthead/sprints/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Sprint from '@/models/ProjectManagement/Sprint';
import { sendSprintNotification } from '@/app/utils/projectNotifications';

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

// GET - Fetch single sprint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const sprint = await Sprint.findById(id);
    
    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      );
    }

    sprint.health = calculateHealth(sprint);
    await sprint.save();

    return NextResponse.json({
      success: true,
      sprint
    });
  } catch (error) {
    console.error('Error fetching sprint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sprint' },
      { status: 500 }
    );
  }
}

// PATCH - Update sprint
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { action, userId, userName, ...updateData } = body;

    const { id } = await params;
    const sprint = await Sprint.findById(id);
    
    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update-details':
        Object.assign(sprint, updateData);
        break;

      case 'add-member':
        if (!updateData.member) {
          return NextResponse.json({ error: 'Member data required' }, { status: 400 });
        }
        sprint.members.push({
          ...updateData.member,
          joinedAt: new Date()
        });

        // Create TimeIntents for the new member
        try {
          const TimeIntent = (await import('@/models/CalendarEvent')).TimeIntent;
          
          // Sprint start event
          await new TimeIntent({
            userId: updateData.member.userId,
            type: 'reminder',
            title: `Sprint Start: ${sprint.title}`,
            description: `${sprint.sprintNumber} - ${sprint.description}`,
            startTime: sprint.startDate,
            endTime: sprint.startDate,
            priority: 'medium',
            linkedProjectId: sprint._id.toString(),
            color: '#9C27B0',
            isSystemGenerated: true,
            createdBy: { userId: 'system', name: 'System' }
          }).save();

          // Sprint end event
          await new TimeIntent({
            userId: updateData.member.userId,
            type: 'deadline',
            title: `Sprint End: ${sprint.title}`,
            description: `${sprint.sprintNumber} - ${sprint.description}`,
            startTime: sprint.endDate,
            endTime: sprint.endDate,
            priority: 'high',
            linkedProjectId: sprint._id.toString(),
            color: '#9C27B0',
            isSystemGenerated: true,
            createdBy: { userId: 'system', name: 'System' }
          }).save();
        } catch (timeIntentError) {
          console.error('Failed to create TimeIntents for new member:', timeIntentError);
        }
        break;

      case 'remove-member':
        const memberIndex = sprint.members.findIndex(
          (m: any) => m.userId === updateData.memberId && !m.leftAt
        );
        if (memberIndex !== -1) {
          sprint.members[memberIndex].leftAt = new Date();
        }
        break;

      case 'change-lead':
        sprint.groupLead = updateData.newLeadId;
        const oldLeadIndex = sprint.members.findIndex(
          (m: any) => m.userId === sprint.groupLead && !m.leftAt
        );
        const newLeadIndex = sprint.members.findIndex(
          (m: any) => m.userId === updateData.newLeadId && !m.leftAt
        );
        if (oldLeadIndex !== -1) sprint.members[oldLeadIndex].role = 'member';
        if (newLeadIndex !== -1) sprint.members[newLeadIndex].role = 'lead';
        break;

      case 'complete':
        sprint.status = 'completed';
        sprint.completedAt = new Date();
        break;

      case 'close':
        sprint.status = 'closed';
        break;

      case 'reopen':
        sprint.status = 'active';
        sprint.completedAt = undefined;
        break;

      case 'add-chat-message':
        if (!updateData.message) {
          return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }
        sprint.chat.push({
          userId,
          userName,
          message: updateData.message,
          timestamp: new Date()
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    sprint.health = calculateHealth(sprint);
    await sprint.save();

    // Send notifications
    if (action !== 'update-details' && action !== 'add-chat-message') {
      try {
        await sendSprintNotification(
          sprint,
          action,
          userId,
          userName
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }

    return NextResponse.json({
      success: true,
      sprint
    });
  } catch (error) {
    console.error('Error updating sprint:', error);
    return NextResponse.json(
      { error: 'Failed to update sprint' },
      { status: 500 }
    );
  }
}

// DELETE - Delete sprint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const sprint = await Sprint.findByIdAndDelete(id);
    
    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sprint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sprint:', error);
    return NextResponse.json(
      { error: 'Failed to delete sprint' },
      { status: 500 }
    );
  }
}