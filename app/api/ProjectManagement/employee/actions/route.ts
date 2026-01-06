// app/api/ProjectManagement/employee/actions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Sprint from '@/models/ProjectManagement/Sprint';
import { saveAttachment } from '@/app/utils/projectFileUpload';

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
      message,
      description,
      newDueDate,
      submissionNote,
      files
    } = body;

    if (!sprintId || !actionId || !action || !userId) {
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

    // Verify user is a member of the sprint
    const member = sprint.members.find((m: any) => 
      (m.userId === userId || m.name === userId) && !m.leftAt
    );
    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this sprint' },
        { status: 403 }
      );
    }

    const sprintAction = sprint.actions.find((a: any) => a._id?.toString() === actionId);
    if (!sprintAction) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    // Verify user is assigned to this action (check both userId and member's ObjectId)
    const isAssigned = sprintAction.assignedTo.some((assignedId: string) => 
      assignedId === userId || assignedId === member.userId
    );
    
    if (!isAssigned) {
      return NextResponse.json(
        { error: 'You are not assigned to this action' },
        { status: 403 }
      );
    }

    const isLead = member.role === 'lead';

    switch (action) {
      case 'start-work':
        // Anyone assigned can start work
        if (sprintAction.status !== 'pending') {
          return NextResponse.json(
            { error: 'Action is not in pending status' },
            { status: 400 }
          );
        }
        sprintAction.status = 'in-progress';
        sprintAction.history.push({
          action: 'status_changed',
          performedBy: userId,
          performedByName: userName,
          timestamp: new Date(),
          details: 'Changed status to in-progress'
        });
        break;

      case 'submit-for-review':
        // Anyone assigned can submit for review
        if (sprintAction.status !== 'in-progress') {
          return NextResponse.json(
            { error: 'Action must be in-progress to submit for review' },
            { status: 400 }
          );
        }
        if (!submissionNote) {
          return NextResponse.json(
            { error: 'Submission note is required' },
            { status: 400 }
          );
        }
        
        sprintAction.status = 'in-review';
        sprintAction.submittedAt = new Date();
        sprintAction.submissionNote = submissionNote;
        
        // Handle submission attachments
        if (files && files.length > 0) {
          const submissionPaths = files.map((file: any) => 
            saveAttachment(`${sprint.sprintNumber}-action-submission`, file)
          );
          // Store in a new field for submission attachments
          if (!sprintAction.submissionAttachments) {
            sprintAction.submissionAttachments = [];
          }
          sprintAction.submissionAttachments = submissionPaths;
        }
        
        sprintAction.history.push({
          action: 'submitted_for_review',
          performedBy: userId,
          performedByName: userName,
          timestamp: new Date(),
          details: submissionNote
        });
        break;

      case 'add-comment':
        if (!message) {
          return NextResponse.json(
            { error: 'Comment message is required' },
            { status: 400 }
          );
        }
        sprintAction.comments.push({
          userId,
          userName,
          message,
          createdAt: new Date()
        });
        sprintAction.history.push({
          action: 'comment_added',
          performedBy: userId,
          performedByName: userName,
          timestamp: new Date(),
          details: 'Added a comment'
        });
        break;

      case 'report-blocker':
        if (!description) {
          return NextResponse.json(
            { error: 'Blocker description is required' },
            { status: 400 }
          );
        }
        
        // Handle blocker attachments
        let blockerAttachments: string[] = [];
        if (files && files.length > 0) {
          blockerAttachments = files.map((file: any) => 
            saveAttachment(`${sprint.sprintNumber}-action-blocker`, file)
          );
        }
        
        sprintAction.blockers.push({
          description,
          reportedBy: userName,
          reportedAt: new Date(),
          isResolved: false,
          attachments: blockerAttachments
        });
        sprintAction.history.push({
          action: 'blocker_reported',
          performedBy: userId,
          performedByName: userName,
          timestamp: new Date(),
          details: `Reported blocker: ${description}`
        });
        break;

      case 'update-deadline':
        // Only lead can update deadline
        if (!isLead) {
          return NextResponse.json(
            { error: 'Only group lead can update deadlines' },
            { status: 403 }
          );
        }
        if (!newDueDate) {
          return NextResponse.json(
            { error: 'New due date is required' },
            { status: 400 }
          );
        }
        const oldDueDate = sprintAction.dueDate;
        sprintAction.dueDate = new Date(newDueDate);
        sprintAction.history.push({
          action: 'deadline_updated',
          performedBy: userId,
          performedByName: userName,
          timestamp: new Date(),
          details: `Updated deadline from ${oldDueDate ? new Date(oldDueDate).toLocaleDateString() : 'none'} to ${new Date(newDueDate).toLocaleDateString()}`
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    sprintAction.updatedAt = new Date();
    await sprint.save();

    return NextResponse.json({
      success: true,
      action: sprintAction
    });
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json(
      { error: 'Failed to update action' },
      { status: 500 }
    );
  }
}