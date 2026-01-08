// ============================================
// app/api/super/workflows/access/route.ts
// Check which super functionalities a user can access
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import SuperFunctionality from '@/models/SuperFunctionality';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const department = searchParams.get('department');
    
    if (!userId || !department) {
      return NextResponse.json(
        { error: 'userId and department are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking access for user ${userId} in department ${department}`);

    // Find all super functionalities the user can access
    const accessibleFunctionalities = await SuperFunctionality.find({
      $or: [
        // Organization-wide access
        { 'accessControl.type': 'organization' },
        
        // Department-specific access
        { 
          'accessControl.type': 'departments',
          'accessControl.departments': department
        },
        
        // User-specific access
        {
          'accessControl.type': 'specific_users',
          'accessControl.users': userId
        }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

    console.log(`✅ Found ${accessibleFunctionalities.length} accessible super functionalities`);

    return NextResponse.json({
      success: true,
      functionalities: accessibleFunctionalities,
      count: accessibleFunctionalities.length
    });
  } catch (error) {
    console.error('❌ Error checking super functionality access:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}