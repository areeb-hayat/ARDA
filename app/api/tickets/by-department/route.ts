// app/api/tickets/by-department/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Ticket from '@/models/Ticket';

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

    // Fetch all tickets in the department with full details
    const tickets = await Ticket.find({
      department: department
    })
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json({
      success: true,
      tickets: tickets,
      total: tickets.length
    });
  } catch (error) {
    console.error('Error fetching department tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department tickets' },
      { status: 500 }
    );
  }
}