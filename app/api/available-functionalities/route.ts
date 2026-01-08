// ============================================
// app/api/available-functionalities/route.ts
// Get functionalities available to a user for ticket creation
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getAvailableFunctionalitiesForUser } from '@/lib/functionalityUtils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const department = searchParams.get('department');
    
    if (!userId || !department) {
      return NextResponse.json(
        { error: 'userId and department parameters are required' },
        { status: 400 }
      );
    }

    const functionalities = await getAvailableFunctionalitiesForUser(userId, department);

    return NextResponse.json({ 
      success: true, 
      functionalities: functionalities.all,
      breakdown: {
        regular: functionalities.regular.length,
        super: functionalities.super.length,
        total: functionalities.all.length
      }
    });
  } catch (error) {
    console.error('Error fetching available functionalities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch functionalities' },
      { status: 500 }
    );
  }
}