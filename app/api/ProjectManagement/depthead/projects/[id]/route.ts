// app/api/ProjectManagement/depthead/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Project from '@/models/ProjectManagement/Project';
import { sendProjectNotification } from '@/app/utils/projectNotifications';

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

// GET - Fetch single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const project = await Project.findById(id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    project.health = calculateHealth(project);
    await project.save();

    return NextResponse.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { action, userId, userName, ...updateData } = body;

    const { id } = await params;
    const project = await Project.findById(id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update-details':
        Object.assign(project, updateData);
        break;

      case 'add-member':
        if (!updateData.member) {
          return NextResponse.json({ error: 'Member data required' }, { status: 400 });
        }
        project.members.push({
          ...updateData.member,
          joinedAt: new Date()
        });

        // Create TimeIntents for the new member
        try {
          const TimeIntent = (await import('@/models/CalendarEvent')).TimeIntent;
          
          // Project start event
          await new TimeIntent({
            userId: updateData.member.userId,
            type: 'reminder',
            title: `Project Start: ${project.title}`,
            description: `${project.projectNumber} - ${project.description}`,
            startTime: project.startDate,
            endTime: project.startDate,
            priority: 'medium',
            linkedProjectId: project._id.toString(),
            color: '#4CAF50',
            isSystemGenerated: true,
            createdBy: { userId: 'system', name: 'System' }
          }).save();

          // Project deadline event if exists
          if (project.targetEndDate) {
            await new TimeIntent({
              userId: updateData.member.userId,
              type: 'deadline',
              title: `Project Deadline: ${project.title}`,
              description: `${project.projectNumber} - ${project.description}`,
              startTime: project.targetEndDate,
              endTime: project.targetEndDate,
              priority: 'high',
              linkedProjectId: project._id.toString(),
              color: '#F44336',
              isSystemGenerated: true,
              createdBy: { userId: 'system', name: 'System' }
            }).save();
          }
        } catch (timeIntentError) {
          console.error('Failed to create TimeIntents for new member:', timeIntentError);
        }
        break;

      case 'remove-member':
        const memberIndex = project.members.findIndex(
          (m: any) => m.userId === updateData.memberId && !m.leftAt
        );
        if (memberIndex !== -1) {
          project.members[memberIndex].leftAt = new Date();
        }
        break;

      case 'change-lead':
        project.groupLead = updateData.newLeadId;
        const oldLeadIndex = project.members.findIndex(
          (m: any) => m.userId === project.groupLead && !m.leftAt
        );
        const newLeadIndex = project.members.findIndex(
          (m: any) => m.userId === updateData.newLeadId && !m.leftAt
        );
        if (oldLeadIndex !== -1) project.members[oldLeadIndex].role = 'member';
        if (newLeadIndex !== -1) project.members[newLeadIndex].role = 'lead';
        break;

      case 'complete':
        project.status = 'completed';
        project.completedAt = new Date();
        break;

      case 'archive':
        project.status = 'archived';
        break;

      case 'reopen':
        project.status = 'active';
        project.completedAt = undefined;
        break;

      case 'add-chat-message':
        if (!updateData.message) {
          return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }
        project.chat.push({
          userId,
          userName,
          message: updateData.message,
          timestamp: new Date()
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    project.health = calculateHealth(project);
    await project.save();

    // Send notifications
    if (action !== 'update-details' && action !== 'add-chat-message') {
      try {
        await sendProjectNotification(
          project,
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
      project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const project = await Project.findByIdAndDelete(id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}