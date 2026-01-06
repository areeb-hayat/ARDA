// app/api/ProjectManagement/depthead/deliverables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Project from '@/models/ProjectManagement/Project';
import FormData from '@/models/FormData';
import { saveAttachment } from '@/app/utils/projectFileUpload';
import { sendDeliverableNotification } from '@/app/utils/projectNotifications';
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

// POST - Create deliverable
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { 
      projectId, 
      title, 
      description, 
      assignedTo,
      dueDate,
      userId,
      userName,
      attachments
    } = body;

    if (!projectId || !title || !description || !assignedTo || assignedTo.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Validate assignees are project members
    const memberIds = project.members
      .filter((m: any) => !m.leftAt)
      .map((m: any) => m.userId);
    
    const invalidAssignees = assignedTo.filter((id: string) => !memberIds.includes(id));
    if (invalidAssignees.length > 0) {
      return NextResponse.json(
        { error: 'Some assigned users are not project members' },
        { status: 400 }
      );
    }

    // Handle attachments - save and store paths
    let savedAttachmentPaths: string[] = [];
    if (attachments && attachments.length > 0) {
      savedAttachmentPaths = attachments.map((file: any) => 
        saveAttachment(`${project.projectNumber}-deliverable`, file)
      );
    }

    const deliverable = {
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
          details: 'Deliverable created'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    project.deliverables.push(deliverable);
    project.health = calculateHealth(project);
    await project.save();

    const savedDeliverable = project.deliverables[project.deliverables.length - 1];

    // Sync deliverable to calendar for assigned members AND dept head if dueDate exists
    if (dueDate) {
      // Create array with assignedTo userIds
      const usersToSync = [...assignedTo];
      
      // Get dept head's userId from FormData using project.createdBy (username)
      const deptHeadUser = await FormData.findOne({ username: project.createdBy }).select('_id');
      const deptHeadUserId = deptHeadUser ? deptHeadUser._id.toString() : null;
      
      // Add dept head userId if not already in assignedTo
      if (deptHeadUserId && !usersToSync.includes(deptHeadUserId)) {
        usersToSync.push(deptHeadUserId);
      }

      const calendarSyncPromises = usersToSync.map(async (userIdToSync: string) => {
        try {
          await createCalendarEvent({
            userId: userIdToSync,
            type: 'deadline',
            title: `Deliverable: ${title}`,
            description: `Project: ${project.title} - ${description}`,
            startTime: new Date(dueDate),
            endTime: new Date(dueDate),
            priority: 'high',
            linkedProjectId: savedDeliverable._id.toString(),
            color: '#F44336'
          });
        } catch (err) {
          console.error(`Calendar sync error for user ${userIdToSync}:`, err);
        }
      });

      await Promise.allSettled(calendarSyncPromises);
    }

    // Send notification
    try {
      await sendDeliverableNotification(
        project,
        savedDeliverable,
        'created',
        userId,
        userName
      );
    } catch (notifError) {
      console.error('Failed to send deliverable notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      deliverable: savedDeliverable
    });
  } catch (error) {
    console.error('Error creating deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    );
  }
}

// PATCH - Update deliverable
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { 
      projectId, 
      deliverableId, 
      action, 
      userId, 
      userName,
      ...updateData 
    } = body;

    if (!projectId || !deliverableId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const deliverable = project.deliverables.id(deliverableId);
    
    if (!deliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
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
        const oldStatus = deliverable.status;
        deliverable.status = updateData.newStatus;
        historyEntry.action = 'status_changed';
        historyEntry.details = `Changed from ${oldStatus} to ${updateData.newStatus}`;
        if (updateData.newStatus === 'done') {
          deliverable.submittedAt = new Date();
          
          // Mark calendar events as completed
          try {
            const events = await TimeIntent.find({
              linkedProjectId: deliverableId.toString(),
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
        deliverable.status = 'pending';
        deliverable.submittedAt = undefined;
        deliverable.submissionNote = undefined;
        historyEntry.action = 'reopened';
        historyEntry.details = 'Deliverable reopened';
        
        // Reopen calendar events
        try {
          const events = await TimeIntent.find({
            linkedProjectId: deliverableId.toString(),
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
        deliverable.comments.push({
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
        const blocker = deliverable.blockers[updateData.blockerIndex];
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
        deliverable.dueDate = new Date(updateData.newDueDate);
        historyEntry.action = 'deadline_updated';
        historyEntry.details = `Due date updated to ${new Date(updateData.newDueDate).toLocaleDateString()}`;
        
        // Update calendar events for all users who have events
        try {
          const events = await TimeIntent.find({
            linkedProjectId: deliverableId.toString(),
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
        const memberToAdd = project.members.find((m: any) => 
          m.userId === updateData.memberId && !m.leftAt
        );
        if (!memberToAdd) {
          return NextResponse.json({ error: 'User is not a project member' }, { status: 400 });
        }
        if (deliverable.assignedTo.includes(updateData.memberId)) {
          return NextResponse.json({ error: 'Member already assigned' }, { status: 400 });
        }
        deliverable.assignedTo.push(updateData.memberId);
        historyEntry.action = 'member_added';
        historyEntry.details = `Added ${memberToAdd.name} to deliverable`;
        
        // Create calendar event for new member if dueDate exists - updateData.memberId is already userId
        if (deliverable.dueDate) {
          try {
            await createCalendarEvent({
              userId: updateData.memberId,
              type: 'deadline',
              title: `Deliverable: ${deliverable.title}`,
              description: `Project: ${project.title} - ${deliverable.description}`,
              startTime: deliverable.dueDate,
              endTime: deliverable.dueDate,
              priority: 'high',
              linkedProjectId: deliverableId.toString(),
              color: '#F44336'
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
        const memberIndex = deliverable.assignedTo.indexOf(updateData.memberId);
        if (memberIndex === -1) {
          return NextResponse.json({ error: 'Member not assigned' }, { status: 400 });
        }
        const memberToRemove = project.members.find((m: any) => m.userId === updateData.memberId);
        deliverable.assignedTo.splice(memberIndex, 1);
        historyEntry.action = 'member_removed';
        historyEntry.details = `Removed ${memberToRemove?.name || 'member'} from deliverable`;
        
        // Delete calendar event for removed member
        try {
          const event = await TimeIntent.findOne({
            userId: updateData.memberId,
            linkedProjectId: deliverableId.toString(),
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

    deliverable.history.push(historyEntry);
    deliverable.updatedAt = new Date();
    project.health = calculateHealth(project);
    await project.save();

    // Send notification
    try {
      await sendDeliverableNotification(
        project,
        deliverable,
        action,
        userId,
        userName
      );
    } catch (notifError) {
      console.error('Failed to send deliverable notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      deliverable
    });
  } catch (error) {
    console.error('Error updating deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to update deliverable' },
      { status: 500 }
    );
  }
}