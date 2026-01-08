// ===== app/api/ticketing/functionalities/route.ts =====
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Functionality from '@/models/Functionality';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Build query
    const query: any = {};
    
    if (search) {
      // Uses text index: { name: 'text', description: 'text' }
      query.$text = { $search: search };
    }

    // Build sort
    const sortOptions: any = {};
    if (search) {
      // Sort by text relevance when searching
      sortOptions.score = { $meta: 'textScore' };
    } else {
      // Default sort by most recent
      sortOptions.createdAt = -1;
    }

    // Uses appropriate indexes:
    // - Text index if searching
    // - { createdAt: -1 } for default sort
    const functionalities = await Functionality.find(query)
      .select('name description department formSchema workflow createdAt')
      .sort(sortOptions)
      .lean();

    // Get unique departments that have functionalities
    const departments = await Functionality.distinct('department');

    return NextResponse.json({
      success: true,
      functionalities,
      departments: departments.sort()
    });
  } catch (error) {
    console.error('Error fetching functionalities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch functionalities' },
      { status: 500 }
    );
  }
}