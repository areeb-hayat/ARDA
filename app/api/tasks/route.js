// ===== app/api/tasks/route.js =====
import dbConnect from '@/lib/mongoose';
import Task from '@/models/Task';
import Project from '@/models/Project';
import { NextResponse } from 'next/server';
import { createCalendarEventsWithTracking } from '@/app/utils/calendarSync';

// GET - Fetch tasks with department isolation
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const projectId = searchParams.get('projectId');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    
    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department parameter is required' },
        { status: 400 }
      );
    }
    
    // Build query with department isolation
    const query = { department };
    
    // Filter by project if provided
    if (projectId) {
      query.projectId = projectId;
    }
    
    // Filter by assignee if employeeId provided
    if (employeeId) {
      query['assignees.employeeId'] = employeeId;
    }
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Uses appropriate compound indexes:
    // - { department: 1, status: 1, priority: -1 } if status filter
    // - { projectId: 1, status: 1, priority: -1 } if projectId filter
    // - { 'assignees.employeeId': 1, status: 1, dueDate: 1 } if employeeId filter
    const tasks = await Task.find(query)
      .populate('projectId', 'name status')
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      data: tasks 
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new task
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.projectId || !body.title || !body.description || !body.department) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate assignees
    if (!body.assignees || body.assignees.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one assignee is required' },
        { status: 400 }
      );
    }
    
    const task = await Task.create(body);
    
    // Populate project info
    const populatedTask = await Task.findById(task._id)
      .populate('projectId', 'name status')
      .lean();
    
    // Create calendar events
    if (task.assignees && task.assignees.length > 0) {
      try {
        await createCalendarEventsWithTracking(task._id.toString(), {
          title: task.title,
          description: task.description,
          type: 'task',
          startDate: task.startDate || undefined,
          dueDate: task.dueDate,
          assignees: task.assignees,
          createdBy: task.createdBy
        });
        console.log(`✓ Calendar events created for task: ${task.title}`);
      } catch (calError) {
        console.error('Error creating calendar events:', calError);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: populatedTask 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}