// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    
    // Fetch from formdatas collection
    const formdatasCollection = db.collection('formdatas');
    
    const users = await formdatasCollection.find({}).toArray();
    
    return NextResponse.json(
      { users },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, department, title, isDeptHead, isExecutive, isApproved } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = mongoose.connection.db;
    const formdatasCollection = db.collection('formdatas');

    const updateData: any = {};
    if (department !== undefined) updateData.department = department;
    if (title !== undefined) updateData.title = title;
    if (isDeptHead !== undefined) updateData.isDeptHead = isDeptHead;
    if (isExecutive !== undefined) updateData.isExecutive = isExecutive;
    if (isApproved !== undefined) updateData.isApproved = isApproved;
    updateData.updatedAt = new Date();

    const { ObjectId } = require('mongodb');
    const result = await formdatasCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If isExecutive was set to false or null, clean up executive departments
    if (isExecutive === false || isExecutive === null) {
      const executiveDepartmentsCollection = db.collection('executivedepartments');
      await executiveDepartmentsCollection.deleteOne({ userId });
    }

    return NextResponse.json(
      { message: 'User updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = mongoose.connection.db;
    const formdatasCollection = db.collection('formdatas');
    const executiveDepartmentsCollection = db.collection('executivedepartments');

    const { ObjectId } = require('mongodb');
    
    // Delete user
    const result = await formdatasCollection.deleteOne(
      { _id: new ObjectId(userId) }
    );

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Also delete executive departments if they exist
    await executiveDepartmentsCollection.deleteOne({ userId });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}