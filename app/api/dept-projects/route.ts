// app/api/dept-projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Project from '@/models/ProjectManagement/Project';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    if (!department) {
      return NextResponse.json(
        { error: 'department is required' },
        { status: 400 }
      );
    }

    // Fetch all projects in the department (all statuses)
    const projects = await Project.find({
      department: department
    }).sort({ createdAt: -1 });

    // Calculate project statistics for each project
    const projectsWithStats = projects.map(project => {
      const projectObj = project.toObject();
      
      // Calculate deliverables stats
      const totalDeliverables = projectObj.deliverables?.length || 0;
      const completedDeliverables = projectObj.deliverables?.filter(
        (d: any) => d.status === 'done'
      ).length || 0;
      const pendingDeliverables = projectObj.deliverables?.filter(
        (d: any) => d.status === 'pending'
      ).length || 0;
      const inProgressDeliverables = projectObj.deliverables?.filter(
        (d: any) => d.status === 'in-progress'
      ).length || 0;
      const inReviewDeliverables = projectObj.deliverables?.filter(
        (d: any) => d.status === 'in-review'
      ).length || 0;
      
      // Calculate blocked deliverables
      const blockedDeliverables = projectObj.deliverables?.filter(
        (d: any) => d.blockers?.some((b: any) => !b.isResolved)
      ).length || 0;
      
      // Calculate team size (active members only)
      const teamSize = projectObj.members?.filter(
        (m: any) => !m.leftAt
      ).length || 0;
      
      // Calculate days remaining
      const now = new Date();
      const endDate = projectObj.targetEndDate ? new Date(projectObj.targetEndDate) : null;
      const daysRemaining = endDate 
        ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      // Calculate progress percentage
      const progressPercentage = totalDeliverables > 0 
        ? Math.round((completedDeliverables / totalDeliverables) * 100)
        : 0;

      return {
        ...projectObj,
        stats: {
          totalDeliverables,
          completedDeliverables,
          pendingDeliverables,
          inProgressDeliverables,
          inReviewDeliverables,
          blockedDeliverables,
          teamSize,
          daysRemaining,
          progressPercentage
        }
      };
    });

    return NextResponse.json({
      success: true,
      projects: projectsWithStats,
      total: projectsWithStats.length
    });
  } catch (error) {
    console.error('Error fetching department projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department projects' },
      { status: 500 }
    );
  }
}