// app/api/admin/executive-departments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    await dbConnect();
    const db = mongoose.connection.db;
    const executiveDepartmentsCollection = db.collection('executivedepartments');

    if (userId) {
      // Get departments for a specific executive
      const executiveData = await executiveDepartmentsCollection.findOne({
        userId: userId
      });

      return NextResponse.json(
        { 
          departments: executiveData?.departments || [],
          exists: !!executiveData
        },
        { status: 200 }
      );
    } else {
      // Get all executive department assignments
      const allExecutives = await executiveDepartmentsCollection.find({}).toArray();
      
      return NextResponse.json(
        { executives: allExecutives },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error fetching executive departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executive departments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, username, departments } = await request.json();

    if (!userId || !username || !Array.isArray(departments)) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, username, or departments' },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = mongoose.connection.db;
    const executiveDepartmentsCollection = db.collection('executivedepartments');

    // Upsert the executive departments assignment
    const result = await executiveDepartmentsCollection.updateOne(
      { userId },
      {
        $set: {
          username,
          departments,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json(
      { 
        message: 'Executive departments updated successfully',
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating executive departments:', error);
    return NextResponse.json(
      { error: 'Failed to update executive departments', details: error instanceof Error ? error.message : 'Unknown error' },
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
    const executiveDepartmentsCollection = db.collection('executivedepartments');

    const result = await executiveDepartmentsCollection.deleteOne({ userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Executive department assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Executive departments deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting executive departments:', error);
    return NextResponse.json(
      { error: 'Failed to delete executive departments' },
      { status: 500 }
    );
  }
}