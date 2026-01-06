// ===== app/api/appointments/users/route.ts =====
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import FormData from '@/models/FormData';

/**
 * GET /api/appointments/users
 * Search for users to invite to appointments
 * 
 * Query Parameters:
 * - search: Search term (name, username, or employee ID)
 * - currentUsername: Current user's username (to exclude from results)
 * 
 * Returns: Array of users with their details
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const currentUsername = searchParams.get('currentUsername');
    
    if (!currentUsername) {
      return NextResponse.json({ 
        error: 'Current username is required' 
      }, { status: 400 });
    }
    
    // Build query - uses compound index: { department: 1, status: 1 }
    const query: any = {
      status: 'approved', // Only approved users can be invited
      username: { $ne: currentUsername } // Exclude current user
    };
    
    let users;
    
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      
      // Search in multiple fields
      // Uses text index if available, otherwise uses regex
      query.$or = [
        { 'basicDetails.name': { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { employeeNumber: { $regex: searchTerm, $options: 'i' } },
        { 'contactInformation.email': { $regex: searchTerm, $options: 'i' } }
      ];
      
      users = await FormData.find(query)
        .select('username basicDetails.name department title employeeNumber contactInformation.email')
        .limit(50)
        .sort({ 'basicDetails.name': 1 })
        .lean();
    } else {
      // No search term - return recent approved users
      users = await FormData.find(query)
        .select('username basicDetails.name department title employeeNumber contactInformation.email')
        .limit(20)
        .sort({ 'basicDetails.name': 1 })
        .lean();
    }
    
    // Format response
    const formattedUsers = users.map(user => ({
      username: user.username,
      displayName: user.basicDetails?.name || user.username,
      department: user.department || 'No Department',
      title: user.title || 'No Title',
      employeeId: user.employeeNumber || user.username,
      email: user.contactInformation?.email || ''
    }));
    
    return NextResponse.json({ 
      users: formattedUsers, 
      success: true,
      count: formattedUsers.length
    });
  } catch (error: any) {
    console.error('Users search error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to search users' 
    }, { status: 500 });
  }
}