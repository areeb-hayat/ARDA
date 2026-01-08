// ============================================
// app/api/super/workflows/route.ts
// CRUD operations for SuperFunctionalities
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import SuperFunctionality from '@/models/SuperFunctionality';

// GET - Fetch all super functionalities
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const superFunctionalities = await SuperFunctionality.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      functionalities: superFunctionalities 
    });
  } catch (error) {
    console.error('❌ Error fetching super functionalities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch super functionalities' },
      { status: 500 }
    );
  }
}

// POST - Create new super functionality
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, description, workflow, formSchema, accessControl, createdBy } = body;

    console.log('📝 Creating super functionality:', {
      name,
      accessControlType: accessControl?.type,
      hasWorkflow: !!workflow,
      hasFormSchema: !!formSchema
    });

    // Validation
    if (!name || !workflow || !createdBy) {
      return NextResponse.json(
        { error: 'Name, workflow, and creator info are required' },
        { status: 400 }
      );
    }

    if (!workflow.nodes || workflow.nodes.length < 3) {
      return NextResponse.json(
        { error: 'Workflow must have at least start, one employee, and end nodes' },
        { status: 400 }
      );
    }

    // Build formSchema
    let finalFields: any[] = [];
    const useDefaults = !formSchema || formSchema.useDefaultFields !== false;
    
    if (useDefaults) {
      finalFields = [
        {
          id: 'default-title',
          type: 'text',
          label: 'Title',
          placeholder: 'Enter ticket title',
          required: true,
          order: 0
        },
        {
          id: 'default-description',
          type: 'textarea',
          label: 'Description',
          placeholder: 'Describe the issue in detail',
          required: true,
          order: 1
        },
        {
          id: 'default-urgency',
          type: 'dropdown',
          label: 'Urgency',
          required: true,
          options: ['Low', 'Medium', 'High'],
          order: 2
        },
        {
          id: 'default-urgency-reason',
          type: 'textarea',
          label: 'Reason for High Priority',
          placeholder: 'Explain why this is urgent (required for High priority)',
          required: false,
          order: 3
        },
        {
          id: 'default-attachments',
          type: 'file',
          label: 'Attachments',
          placeholder: 'Upload relevant files',
          required: false,
          order: 4
        }
      ];
    }
    
    if (formSchema && formSchema.fields && formSchema.fields.length > 0) {
      const customFields = formSchema.fields.map((field: any, index: number) => ({
        ...field,
        order: finalFields.length + index
      }));
      finalFields = [...finalFields, ...customFields];
    }

    // Create super functionality
    const superFunctionality = new SuperFunctionality({
      name,
      description: description || '',
      workflow,
      formSchema: {
        fields: finalFields,
        useDefaultFields: useDefaults
      },
      accessControl: accessControl || {
        type: 'organization',
        departments: [],
        users: []
      },
      createdBy
    });

    await superFunctionality.save();

    console.log('✅ Super functionality created:', superFunctionality._id);

    return NextResponse.json({
      success: true,
      functionality: superFunctionality
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating super functionality:', error);
    return NextResponse.json(
      { error: 'Failed to create super functionality' },
      { status: 500 }
    );
  }
}