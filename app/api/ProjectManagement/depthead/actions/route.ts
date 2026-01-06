// app/api/ProjectManagement/depthead/actions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Sprint from '@/models/ProjectManagement/Sprint';
import FormData from '@/models/FormData';
import { saveAttachment } from '@/app/utils/projectFileUpload';
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
      linkedTaskId: eventData.linkedTaskId,
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

// POST - Create action
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { 
      sprintId, 
      title, 
      description, 
      assignedTo,
      dueDate,
      userId,
      userName,
      attachments
    } = body;

    if (!sprintId || !title || !description || !assignedTo || assignedTo.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sprint = await Sprint.findById(sprintId);
    
    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      );
    }

    // Validate assignees are sprint members
    const memberIds = sprint.members
      .filter((m: any) => !m.leftAt)
      .map((m: any) => m.userId);
    
    const invalidAssignees = assignedTo.filter((id: string) => !memberIds.includes(id));
    if (invalidAssignees.length > 0) {
      return NextResponse.json(
        { error: 'Some assigned users are not sprint members' },
        { status: 400 }
      );
    }

    // Handle attachments - save and store paths
    let savedAttachmentPaths: string[] = [];
    if (attachments && attachments.length > 0) {
      savedAttachmentPaths = attachments.map((file: any) => 
        saveAttachment(`${sprint.sprintNumber}-action`, file)
      );
    }

    const action = {
      title,
      description,
      assignedTo,
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      attachments: savedAttachmentPaths,
      blockers: [],
      comments: [],
      history: [
        {
          action: 'created',
          performedBy: userId,
          performedByName: userName,
          timestamp: new Date(),
          details: 'Action created'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    sprint.actions.push(action);
    sprint.health = calculateHealth(sprint);
    await sprint.save();

    const savedAction = sprint.actions[sprint.actions.length - 1];

    // Sync action to calendar for assigned members AND dept head if dueDate exists
    if (dueDate) {
      // Create array with assignedTo userIds
      const usersToSync = [...assignedTo];
      
      // Get dept head's userId from FormData using sprint.createdBy (username)
      const deptHeadUser = await FormData.findOne({ username: sprint.createdBy }).select('_id');
      const deptHeadUserId = deptHeadUser ? deptHeadUser._id.toString() : null;
      
      // Add dept head userId if not already in assignedTo
      if (deptHeadUserId && !usersToSync.includes(deptHeadUserId)) {
        usersToSync.push(deptHeadUserId);
      }

      const calendarSyncPromises = usersToSync.map(async (userIdToSync: string) => {
        try {
          await createCalendarEvent({
            userId: userIdToSync,
            type: 'task-block',
            title: `Action: ${title}`,
            description: `Sprint: ${sprint.title} - ${description}`,
            startTime: new Date(dueDate),
            endTime: new Date(dueDate),
            priority: 'medium',
            linkedTaskId: savedAction._id.toString(),
            color: '#FF9800'
          });
        } catch (err) {
          console.error(`Calendar sync error for user ${userIdToSync}:`, err);
        }
      });

      await Promise.allSettled(calendarSyncPromises);
    }

    return NextResponse.json({
      success: true,
      action: savedAction
    });
  } catch (error) {
    console.error('Error creating action:', error);
    return NextResponse.json(
      { error: 'Failed to create action' },
      { status: 500 }
    );
  }
}

// PATCH - Update action
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { 
      sprintId, 
      actionId, 
      action, 
      userId, 
      userName,
      ...updateData 
    } = body;

    if (!sprintId || !actionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sprint = await Sprint.findById(sprintId);
    
    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      );
    }

    const actionItem = sprint.actions.id(actionId);
    
    if (!actionItem) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    let historyEntry: any = {
      performedBy: userId,
      performedByName: userName,
      timestamp: new Date()
    };

    switch (action) {
      case 'change-status':
        if (!updateData.newStatus) {
          return NextResponse.json({ error: 'New status required' }, { status: 400 });
        }
        const oldStatus = actionItem.status;
        actionItem.status = updateData.newStatus;
        historyEntry.action = 'status_changed';
        historyEntry.details = `Changed from ${oldStatus} to ${updateData.newStatus}`;
        if (updateData.newStatus === 'done') {
          actionItem.submittedAt = new Date();
          
          // Mark calendar events as completed
          try {
            const events = await TimeIntent.find({
              linkedTaskId: actionId.toString(),
              isSystemGenerated: true
            });
            
            for (const event of events) {
              event.isCompleted = true;
              event.completedAt = new Date();
              await event.save();
            }
          } catch (err) {
            console.error('Error marking calendar events as completed:', err);
          }
        }
        break;

      case 'reopen':
        actionItem.status = 'pending';
        actionItem.submittedAt = undefined;
        actionItem.submissionNote = undefined;
        historyEntry.action = 'reopened';
        historyEntry.details = 'Action reopened';
        
        // Reopen calendar events
        try {
          const events = await TimeIntent.find({
            linkedTaskId: actionId.toString(),
            isSystemGenerated: true
          });
          
          for (const event of events) {
            event.isCompleted = false;
            event.completedAt = undefined;
            await event.save();
          }
        } catch (err) {
          console.error('Error reopening calendar events:', err);
        }
        break;

      case 'add-comment':
        if (!updateData.message) {
          return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }
        actionItem.comments.push({
          userId,
          userName,
          message: updateData.message,
          createdAt: new Date()
        });
        historyEntry.action = 'comment_added';
        historyEntry.details = 'Comment added';
        break;

      case 'resolve-blocker':
        if (updateData.blockerIndex === undefined) {
          return NextResponse.json({ error: 'Blocker index required' }, { status: 400 });
        }
        const blocker = actionItem.blockers[updateData.blockerIndex];
        if (blocker) {
          blocker.isResolved = true;
          blocker.resolvedBy = userId;
          blocker.resolvedAt = new Date();
        }
        historyEntry.action = 'blocker_resolved';
        historyEntry.details = 'Blocker resolved';
        break;

      case 'update-deadline':
        if (!updateData.newDueDate) {
          return NextResponse.json({ error: 'New due date required' }, { status: 400 });
        }
        actionItem.dueDate = new Date(updateData.newDueDate);
        historyEntry.action = 'deadline_updated';
        historyEntry.details = `Due date updated to ${new Date(updateData.newDueDate).toLocaleDateString()}`;
        
        // Update calendar events for all users who have events
        try {
          const events = await TimeIntent.find({
            linkedTaskId: actionId.toString(),
            isSystemGenerated: true
          });
          
          for (const event of events) {
            event.startTime = new Date(updateData.newDueDate);
            event.endTime = new Date(updateData.newDueDate);
            await event.save();
          }
        } catch (err) {
          console.error('Error updating calendar event deadlines:', err);
        }
        break;

      case 'add-member':
        if (!updateData.memberId) {
          return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
        }
        const memberToAdd = sprint.members.find((m: any) => 
          m.userId === updateData.memberId && !m.leftAt
        );
        if (!memberToAdd) {
          return NextResponse.json({ error: 'User is not a sprint member' }, { status: 400 });
        }
        if (actionItem.assignedTo.includes(updateData.memberId)) {
          return NextResponse.json({ error: 'Member already assigned' }, { status: 400 });
        }
        actionItem.assignedTo.push(updateData.memberId);
        historyEntry.action = 'member_added';
        historyEntry.details = `Added ${memberToAdd.name} to action`;
        
        // Create calendar event for new member if dueDate exists - updateData.memberId is already userId
        if (actionItem.dueDate) {
          try {
            await createCalendarEvent({
              userId: updateData.memberId,
              type: 'task-block',
              title: `Action: ${actionItem.title}`,
              description: `Sprint: ${sprint.title} - ${actionItem.description}`,
              startTime: actionItem.dueDate,
              endTime: actionItem.dueDate,
              priority: 'medium',
              linkedTaskId: actionId.toString(),
              color: '#FF9800'
            });
          } catch (err) {
            console.error('Error creating calendar event for new member:', err);
          }
        }
        break;

      case 'remove-member':
        if (!updateData.memberId) {
          return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
        }
        const memberIndex = actionItem.assignedTo.indexOf(updateData.memberId);
        if (memberIndex === -1) {
          return NextResponse.json({ error: 'Member not assigned' }, { status: 400 });
        }
        const memberToRemove = sprint.members.find((m: any) => m.userId === updateData.memberId);
        actionItem.assignedTo.splice(memberIndex, 1);
        historyEntry.action = 'member_removed';
        historyEntry.details = `Removed ${memberToRemove?.name || 'member'} from action`;
        
        // Delete calendar event for removed member
        try {
          const event = await TimeIntent.findOne({
            userId: updateData.memberId,
            linkedTaskId: actionId.toString(),
            isSystemGenerated: true
          });
          
          if (event) {
            await TimeIntent.findByIdAndDelete(event._id);
          }
        } catch (err) {
          console.error('Error deleting calendar event for removed member:', err);
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    actionItem.history.push(historyEntry);
    actionItem.updatedAt = new Date();
    sprint.health = calculateHealth(sprint);
    await sprint.save();

    return NextResponse.json({
      success: true,
      action: actionItem
    });
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json(
      { error: 'Failed to update action' },
      { status: 500 }
    );
  }
}