// app/api/dept-sprints/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Sprint from '@/models/ProjectManagement/Sprint';

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

    // Fetch all sprints in the department (all statuses)
    const sprints = await Sprint.find({
      department: department
    }).sort({ createdAt: -1 });

    // Calculate sprint statistics for each sprint
    const sprintsWithStats = sprints.map(sprint => {
      const sprintObj = sprint.toObject();
      
      // Calculate actions stats
      const totalActions = sprintObj.actions?.length || 0;
      const completedActions = sprintObj.actions?.filter(
        (a: any) => a.status === 'done'
      ).length || 0;
      const pendingActions = sprintObj.actions?.filter(
        (a: any) => a.status === 'pending'
      ).length || 0;
      const inProgressActions = sprintObj.actions?.filter(
        (a: any) => a.status === 'in-progress'
      ).length || 0;
      const inReviewActions = sprintObj.actions?.filter(
        (a: any) => a.status === 'in-review'
      ).length || 0;
      
      // Calculate blocked actions
      const blockedActions = sprintObj.actions?.filter(
        (a: any) => a.blockers?.some((b: any) => !b.isResolved)
      ).length || 0;
      
      // Calculate team size (active members only)
      const teamSize = sprintObj.members?.filter(
        (m: any) => !m.leftAt
      ).length || 0;
      
      // Calculate days remaining
      const now = new Date();
      const endDate = new Date(sprintObj.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate progress percentage
      const progressPercentage = totalActions > 0 
        ? Math.round((completedActions / totalActions) * 100)
        : 0;

      return {
        ...sprintObj,
        stats: {
          totalActions,
          completedActions,
          pendingActions,
          inProgressActions,
          inReviewActions,
          blockedActions,
          teamSize,
          daysRemaining,
          progressPercentage
        }
      };
    });

    return NextResponse.json({
      success: true,
      sprints: sprintsWithStats,
      total: sprintsWithStats.length
    });
  } catch (error) {
    console.error('Error fetching department sprints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department sprints' },
      { status: 500 }
    );
  }
}