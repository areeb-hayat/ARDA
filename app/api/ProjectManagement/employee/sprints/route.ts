// app/api/ProjectManagement/employee/sprints/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Sprint from '@/models/ProjectManagement/Sprint';

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
    const sprints = await Sprint.find({
      $or: [
        { 'members.userId': userId },
        { 'members.name': userId }
      ]
    }).sort({ createdAt: -1 });

    // Filter to only include sprints where user is currently active
    const activeSprints = sprints.filter(sprint => 
      sprint.members.some(m => 
        (m.userId === userId || m.name === userId) && !m.leftAt
      )
    );

    // Calculate user's role and permissions for each sprint
    const sprintsWithRole = activeSprints.map(sprint => {
      const member = sprint.members.find(m => 
        (m.userId === userId || m.name === userId) && !m.leftAt
      );
      const isLead = member?.role === 'lead';
      
      // Get actions assigned to this user (check both userId and name)
      const myActions = sprint.actions?.filter(a => 
        a.assignedTo.some((assignedId: string) => 
          assignedId === userId || assignedId === member?.userId
        )
      ) || [];

      const pendingActions = myActions.filter(a => a.status !== 'done');

      // Calculate days remaining
      const now = new Date();
      const endDate = new Date(sprint.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...sprint.toObject(),
        myRole: member?.role || 'member',
        isLead,
        myActions: myActions.length,
        myPendingActions: pendingActions.length,
        daysRemaining,
        myUserId: member?.userId // Pass the actual ObjectId for future use
      };
    });

    return NextResponse.json({
      success: true,
      sprints: sprintsWithRole
    });
  } catch (error) {
    console.error('Error fetching employee sprints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sprints' },
      { status: 500 }
    );
  }
}