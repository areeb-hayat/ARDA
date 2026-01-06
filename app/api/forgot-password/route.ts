// app/api/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import sendForgotPasswordEmail from '@/app/utils/forgotPasswordEmail';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { username, email } = await req.json();

    // Validate input
    if (!username || !email) {
      return NextResponse.json(
        { success: false, message: 'Username and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Send password reset email
    const result = await sendForgotPasswordEmail(username, email);

    if (result.success) {
      return NextResponse.json(
        { success: true, message: result.message },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('❌ Forgot password API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again later.' },
      { status: 500 }
    );
  }
}