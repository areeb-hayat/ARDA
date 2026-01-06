// app/api/ProjectManagement/employee/deliverables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Project from '@/models/ProjectManagement/Project';
import { sendDeliverableNotification } from '@/app/utils/projectNotifications';
import { saveAttachment } from '@/app/utils/projectFileUpload';

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
      message,
      description,
      newDueDate,
      submissionNote,
      files
    } = body;

    if (!projectId || !deliverableId || !action || !userId) {
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

    // Verify user is a member of the project
    const member = project.members.find((m: any) => 
      (m.userId === userId || m.name === userId) && !m.leftAt
    );
    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this project' },
        { status: 403 }
      );
    }

    const deliverable = project.deliverables.find((d: any) => d._id?.toString() === deliverableId);
    if (!deliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      );
    }

    // Verify user is assigned to this deliverable (check both userId and member's ObjectId)
    const isAssigned = deliverable.assignedTo.some((assignedId: string) => 
      assignedId === userId || assignedId === member.userId
    );
    
    if (!isAssigned) {
      return NextResponse.json(
        { error: 'You are not assigned to this deliverable' },
        { status: 403 }
      );
    }

    const isLead = member.role === 'lead';

    switch (action) {
      case 'start-work':
        // Anyone assigned can start work
        if (deliverable.status !== 'pending') {
          return NextResponse.json(
            { error: 'Deliverable is not in pending status' },
            { status: 400 }
          );
        }
        deliverable.status = 'in-progress';
        deliverable.history.push({
          action: 'status_changed',
          performedBy: userId,
          performedByName: userName,
          timestamp: new Date(),
          details: 'Changed status to in-progress'
        });
        break;

      case 'submit-for-review':
        // Anyone assigned can submit for review
        if (deliverable.status !== 'in-progress') {
          return NextResponse.json(
            { error: 'Deliverable must be in-progress to submit for review' },
            { status: 400 }
          );
        }
        if (!submissionNote) {
          return NextResponse.json(
            { error: 'Submission note is required' },
            { status: 400 }
          );
        }
        
        deliverable.status = 'in-review';
        deliverable.submittedAt = new Date();
        deliverable.submissionNote = submissionNote;
        
        // Handle submission attachments
        if (files && files.length > 0) {
          const submissionPaths = files.map((file: any) => 
            saveAttachment(`${project.projectNumber}-deliverable-submission`, file)
          );
          // Store in a new field for submission attachments
          if (!deliverable.submissionAttachments) {
            deliverable.submissionAttachments = [];
          }
          deliverable.submissionAttachments = submissionPaths;
        }
        
        deliverable.history.push({
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
        deliverable.comments.push({
          userId,
          userName,
          message,
          createdAt: new Date()
        });
        deliverable.history.push({
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
            saveAttachment(`${project.projectNumber}-deliverable-blocker`, file)
          );
        }
        
        deliverable.blockers.push({
          description,
          reportedBy: userName,
          reportedAt: new Date(),
          isResolved: false,
          attachments: blockerAttachments
        });
        deliverable.history.push({
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
        const oldDueDate = deliverable.dueDate;
        deliverable.dueDate = new Date(newDueDate);
        deliverable.history.push({
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

    deliverable.updatedAt = new Date();
    await project.save();

    // Send notification (non-blocking)
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