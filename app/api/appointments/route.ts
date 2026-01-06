// ===== app/api/appointments/route.ts =====
import Appointment from '@/models/Appointment';
import FormData from '@/models/FormData';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { sendAppointmentInvitation } from '@/app/utils/appointmentNotifications';

// GET - Fetch appointments
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const view = searchParams.get('view'); // 'created', 'invited', 'all'
    const status = searchParams.get('status');
    
    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }
    
    let query: any = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    let appointments;
    
    if (view === 'created') {
      appointments = await Appointment.find({
        creatorUsername: username,
        ...query
      })
      .sort({ createdAt: -1 })
      .lean();
    } else if (view === 'invited') {
      appointments = await Appointment.find({
        'participants.username': username,
        creatorUsername: { $ne: username },
        ...query
      })
      .sort({ createdAt: -1 })
      .lean();
    } else {
      appointments = await Appointment.find({
        $or: [
          { creatorUsername: username, ...query },
          { 'participants.username': username, ...query }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();
    }
    
    return NextResponse.json({ appointments, success: true });
  } catch (error: any) {
    console.error('Appointments GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create appointment request
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { 
      creatorId, 
      creatorUsername, 
      creatorName,
      type,
      participantUsernames,
      title, 
      description, 
      proposedDate, 
      proposedStartTime, 
      proposedEndTime 
    } = body;
    
    if (!creatorId || !creatorUsername || !creatorName || !type || 
        !participantUsernames || !Array.isArray(participantUsernames) || 
        participantUsernames.length === 0 || !title || !proposedDate || 
        !proposedStartTime || !proposedEndTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch participant details using name from basicDetails
    const users = await FormData.find({
      username: { $in: participantUsernames }
    }).select('username basicDetails.name').lean();

    if (users.length !== participantUsernames.length) {
      return NextResponse.json({ 
        error: 'Some participants not found' 
      }, { status: 400 });
    }

    const participants = users.map(user => ({
      userId: user.username,
      username: user.username,
      name: user.basicDetails?.name || user.username,
      status: 'pending'
    }));
    
    const appointment = await Appointment.create({
      creatorId,
      creatorUsername,
      creatorName,
      type,
      participants,
      title,
      description,
      proposedDate: new Date(proposedDate),
      proposedStartTime,
      proposedEndTime,
      status: 'pending',
      history: [{
        action: 'created',
        by: creatorUsername,
        byName: creatorName,
        timestamp: new Date(),
        details: { 
          proposedDate, 
          proposedStartTime, 
          proposedEndTime,
          participantCount: participants.length
        }
      }]
    });

    // Send invitation emails to all participants in background
    Promise.all(
      participantUsernames.map(username => 
        sendAppointmentInvitation(appointment.toObject(), username)
      )
    ).catch(err => console.error('Email notification error:', err));
    
    return NextResponse.json({ appointment, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Appointments POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}