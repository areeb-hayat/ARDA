// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/mongoose';
import FormData from '@/models/FormData';

type UserRole = 'employee.other' | 'employee.hr' | 'depthead.hr' | 'depthead.other' | 'admin';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { username, password } = await request.json();

    console.log('Login attempt for username:', username);

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find employee by username - explicitly select all fields including password
    const employee = await FormData.findOne({ username }).lean();

    console.log('Employee found:', employee ? 'Yes' : 'No');
    if (employee) {
      console.log('Employee status:', employee.status);
      console.log('Employee department:', employee.department);
      console.log('Employee title:', employee.title);
      console.log('Employee isDeptHead:', employee.isDeptHead);
      console.log('Password exists:', employee.password ? 'Yes' : 'No');
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if employee is approved
    if (employee.status && employee.status !== 'approved') {
      console.log('Account not approved. Status:', employee.status);
      return NextResponse.json(
        { success: false, message: 'Your account is pending approval' },
        { status: 403 }
      );
    }

    // Verify password - Add null check
    if (!employee.password) {
      console.log('ERROR: Password field is missing from database');
      return NextResponse.json(
        { success: false, message: 'Account configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);

    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Determine role based on department, title, and isDeptHead
    let role: UserRole = 'employee.other';
    
    const titleLower = employee.title?.toLowerCase() || '';
    const deptLower = employee.department?.toLowerCase() || '';
    
    // PRIORITY 1: Check if super user department (exact match, case-insensitive)
    if (deptLower === 'super user') {
      role = 'admin';
      console.log('User is super user - assigned admin role');
    }
    // PRIORITY 2: Check if HR department
    else if (deptLower.includes('human resources') || 
             deptLower === 'hr' ||
             deptLower === 'human resource') {
      if (employee.isDeptHead) {
        role = 'depthead.hr';
        console.log('User is HR dept head');
      } else {
        role = 'employee.hr';
        console.log('User is HR employee');
      }
    }
    // PRIORITY 3: Other departments (including "admin" department)
    else {
      if (employee.isDeptHead) {
        role = 'depthead.other';
        console.log('User is dept head');
      } else {
        role = 'employee.other';
        console.log('User is regular employee');
      }
    }

    // Prepare user data for response
    const userData = {
      username: employee.username,
      role: role,
      displayName: employee.basicDetails?.name || employee.username,
      department: employee.department,
      title: employee.title,
      isDeptHead: employee.isDeptHead,
      photoUrl: employee.basicDetails?.profileImage,
      email: employee.contactInformation?.email,
      phone: employee.contactInformation?.contactNumber,
      employeeNumber: employee.employeeNumber,
    };

    console.log('Login successful. Role assigned:', role);
    console.log('Department:', employee.department);

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}