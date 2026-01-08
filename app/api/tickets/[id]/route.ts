// app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Ticket from '@/models/Ticket';
import Functionality from '@/models/Functionality';
import SuperFunctionality from '@/models/SuperFunctionality';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;

    console.log(`🔍 Fetching ticket: ${id}`);

    // Find ticket by ID first without populate
    const ticket = await Ticket.findById(id).lean();

    if (!ticket) {
      console.log(`❌ Ticket not found: ${id}`);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Determine if this is a super workflow ticket
    const isSuper = ticket.department === 'Super Workflow';
    
    console.log(`📋 Ticket type: ${isSuper ? 'Super Workflow' : 'Regular'}`);

    // Manually fetch the functionality from the appropriate collection
    let functionality = null;
    
    if (isSuper) {
      functionality = await SuperFunctionality.findById(ticket.functionality)
        .select('+workflow +formSchema +accessControl')
        .lean();
      console.log(`🌟 Fetched SuperFunctionality:`, {
        name: functionality?.name,
        hasWorkflow: !!functionality?.workflow,
        workflowNodes: functionality?.workflow?.nodes?.length,
        workflowEdges: functionality?.workflow?.edges?.length
      });
    } else {
      functionality = await Functionality.findById(ticket.functionality)
        .select('+workflow +formSchema')
        .lean();
      console.log(`📋 Fetched Functionality:`, {
        name: functionality?.name,
        hasWorkflow: !!functionality?.workflow,
        workflowNodes: functionality?.workflow?.nodes?.length,
        workflowEdges: functionality?.workflow?.edges?.length
      });
    }

    if (!functionality) {
      console.error(`❌ Functionality not found for ticket: ${ticket.ticketNumber}`);
      return NextResponse.json(
        { error: 'Functionality not found for this ticket' },
        { status: 404 }
      );
    }

    if (!functionality.workflow) {
      console.error(`❌ Workflow not found in functionality: ${functionality.name}`);
      return NextResponse.json(
        { error: 'Workflow not found in functionality' },
        { status: 400 }
      );
    }

    // Combine ticket with functionality
    const ticketWithFunctionality = {
      ...ticket,
      functionality: {
        _id: functionality._id,
        name: functionality.name,
        department: isSuper ? 'Super Workflow' : functionality.department,
        workflow: functionality.workflow,
        formSchema: functionality.formSchema
      }
    };

    console.log(`✅ Found ticket: ${ticket.ticketNumber}`, {
      hasFunctionality: !!ticketWithFunctionality.functionality,
      hasWorkflow: !!ticketWithFunctionality.functionality?.workflow,
      workflowNodeCount: ticketWithFunctionality.functionality?.workflow?.nodes?.length
    });

    return NextResponse.json(ticketWithFunctionality);
  } catch (error) {
    console.error('❌ Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const updates = await request.json();

    console.log(`📝 Updating ticket: ${id}`);

    // Find and update ticket
    const ticket = await Ticket.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!ticket) {
      console.log(`❌ Ticket not found: ${id}`);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Updated ticket: ${ticket.ticketNumber}`);

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('❌ Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;

    console.log(`🗑️ Deleting ticket: ${id}`);

    // Find and delete ticket
    const ticket = await Ticket.findByIdAndDelete(id).lean();

    if (!ticket) {
      console.log(`❌ Ticket not found: ${id}`);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Deleted ticket: ${ticket.ticketNumber}`);

    return NextResponse.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}