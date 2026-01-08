// ============================================
// app/api/org-employees/route.ts
// Fetch all employees across the organization
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import FormData from '@/models/FormData';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    
    // Build query
    const query: any = {};
    
    if (department) {
      query.department = department;
    }
    
    if (search) {
      query.$or = [
        { 'basicDetails.name': { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch employees
    const employees = await FormData.find(query)
      .select('_id basicDetails.name username title department basicDetails.profileImage')
      .sort({ 'basicDetails.name': 1 })
      .lean();

    console.log(`📋 Fetched ${employees.length} employees from organization`);

    return NextResponse.json({
      success: true,
      employees
    });
  } catch (error) {
    console.error('❌ Error fetching organization employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}