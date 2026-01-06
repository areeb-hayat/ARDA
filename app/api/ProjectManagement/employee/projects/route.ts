// app/api/ProjectManagement/employee/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Project from '@/models/ProjectManagement/Project';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Search by both userId (ObjectId) and name (email) in members array
    const projects = await Project.find({
      $or: [
        { 'members.userId': userId },
        { 'members.name': userId }
      ]
    }).sort({ createdAt: -1 });

    // Filter to only include projects where user is currently active
    const activeProjects = projects.filter(project => 
      project.members.some(m => 
        (m.userId === userId || m.name === userId) && !m.leftAt
      )
    );

    // Calculate user's role and permissions for each project
    const projectsWithRole = activeProjects.map(project => {
      const member = project.members.find(m => 
        (m.userId === userId || m.name === userId) && !m.leftAt
      );
      const isLead = member?.role === 'lead';
      
      // Get deliverables assigned to this user (check both userId and name)
      const myDeliverables = project.deliverables?.filter(d => 
        d.assignedTo.some((assignedId: string) => 
          assignedId === userId || assignedId === member?.userId
        )
      ) || [];

      const pendingDeliverables = myDeliverables.filter(d => d.status !== 'done');

      return {
        ...project.toObject(),
        myRole: member?.role || 'member',
        isLead,
        myDeliverables: myDeliverables.length,
        myPendingDeliverables: pendingDeliverables.length,
        myUserId: member?.userId // Pass the actual ObjectId for future use
      };
    });

    return NextResponse.json({
      success: true,
      projects: projectsWithRole
    });
  } catch (error) {
    console.error('Error fetching employee projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}