// app/api/ProjectManagement/employee/sprints/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Sprint from '@/models/ProjectManagement/Sprint';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { sprintId, userId, userName, message } = body;

    if (!sprintId || !userId || !userName || !message) {
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

    // Verify user is a member
    const isMember = sprint.members.some((m: any) => 
      (m.userId === userId || m.name === userId) && !m.leftAt
    );

    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this sprint' },
        { status: 403 }
      );
    }

    // Add message to chat
    sprint.chat.push({
      userId,
      userName,
      message,
      timestamp: new Date(),
      attachments: []
    });

    await sprint.save();

    return NextResponse.json({
      success: true,
      sprint
    });
  } catch (error) {
    console.error('Error sending sprint chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}