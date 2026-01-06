// ===== app/api/calendar/day-canvas/route.js =====
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { DayCanvas } from '@/models/CalendarEvent';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'User ID and date are required' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    let canvas = await DayCanvas.findOne({
      userId,
      date: startOfDay
    });

    // Create empty canvas if doesn't exist
    if (!canvas) {
      canvas = new DayCanvas({
        userId,
        date: startOfDay,
        content: '',
        checklist: [],
        images: [],
        tags: []
      });
      await canvas.save();
    }

    return NextResponse.json({ canvas });
  } catch (error) {
    console.error('Error fetching day canvas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch day canvas' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, date, content, checklist, images, mindMap, tags, mood, reflection } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'User ID and date are required' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    let canvas = await DayCanvas.findOne({
      userId,
      date: startOfDay
    });

    if (canvas) {
      // Update existing canvas
      if (content !== undefined) canvas.content = content;
      if (checklist !== undefined) canvas.checklist = checklist;
      if (images !== undefined) canvas.images = images;
      if (mindMap !== undefined) canvas.mindMap = mindMap;
      if (tags !== undefined) canvas.tags = tags;
      
      // FIX: Only set mood if it's a valid value, otherwise set to undefined
      if (mood !== undefined && mood !== '') {
        canvas.mood = mood;
      } else if (mood === '') {
        canvas.mood = undefined;
      }
      
      if (reflection !== undefined) canvas.reflection = reflection;
    } else {
      // Create new canvas
      canvas = new DayCanvas({
        userId,
        date: startOfDay,
        content: content || '',
        checklist: checklist || [],
        images: images || [],
        mindMap,
        tags: tags || [],
        // FIX: Only include mood if it has a valid value
        ...(mood && mood !== '' && { mood }),
        reflection: reflection || ''
      });
    }

    await canvas.save();

    return NextResponse.json({
      message: 'Day canvas saved successfully',
      canvas
    });
  } catch (error) {
    console.error('Error saving day canvas:', error);
    return NextResponse.json(
      { error: 'Failed to save day canvas' },
      { status: 500 }
    );
  }
}