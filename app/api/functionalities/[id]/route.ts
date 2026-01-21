// ============================================
// UPDATED: app/api/functionalities/[id]/route.ts
// FIXED: No longer adds default fields on update
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Functionality from '@/models/Functionality';
import Ticket from '@/models/Ticket';

// GET - Fetch single functionality
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const functionality = await Functionality.findById(id).lean();
    
    if (!functionality) {
      return NextResponse.json(
        { error: 'Functionality not found' },
        { status: 404 }
      );
    }

    console.log('📖 Fetched functionality:', {
      id: functionality._id,
      name: functionality.name,
      hasFormSchema: !!functionality.formSchema,
      formSchemaFields: functionality.formSchema?.fields?.length || 0
    });

    return NextResponse.json({
      success: true,
      functionality
    });
  } catch (error) {
    console.error('Error fetching functionality:', error);
    return NextResponse.json(
      { error: 'Failed to fetch functionality' },
      { status: 500 }
    );
  }
}

// PUT - Update functionality
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const body = await request.json();
    const { name, description, workflow, formSchema } = body;

    console.log('✏️ Updating functionality:', {
      id,
      name,
      hasFormSchema: !!formSchema,
      formSchemaFields: formSchema?.fields?.length || 0
    });

    // Validation
    if (!name || !workflow) {
      return NextResponse.json(
        { error: 'Name and workflow are required' },
        { status: 400 }
      );
    }

    if (!workflow.nodes || workflow.nodes.length < 3) {
      return NextResponse.json(
        { error: 'Workflow must have at least start, one employee, and end nodes' },
        { status: 400 }
      );
    }

    const updateData: any = {
      name,
      description: description || '',
      workflow,
    };

    // FIXED: Just save the formSchema as-is, don't add default fields
    if (formSchema !== undefined) {
      updateData.formSchema = formSchema;
      console.log('✅ Saving formSchema as-is - total fields:', formSchema.fields?.length || 0);
    }

    // Update the functionality
    const functionality = await Functionality.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!functionality) {
      return NextResponse.json(
        { error: 'Functionality not found' },
        { status: 404 }
      );
    }

    console.log('✅ Functionality updated successfully:', {
      id: functionality._id,
      formSchemaFieldCount: functionality.formSchema?.fields?.length || 0
    });

    // ============================================
    // Reset active tickets to pending/start
    // ============================================
    
    // Find all active tickets (not resolved or closed) for this functionality
    const activeTickets = await Ticket.find({
      functionality: id,
      status: { $nin: ['resolved', 'closed'] }
    });

    console.log(`🎫 Found ${activeTickets.length} active tickets to reset`);

    if (activeTickets.length > 0) {
      // Find the start node and first employee node in the NEW workflow
      const startNode = workflow.nodes.find((n: any) => n.type === 'start');
      if (!startNode) {
        console.error('❌ No start node found in updated workflow');
        return NextResponse.json(
          { error: 'Updated workflow must have a start node' },
          { status: 400 }
        );
      }

      const firstEdge = workflow.edges.find((e: any) => e.source === startNode.id);
      if (!firstEdge) {
        console.error('❌ No edge from start node in updated workflow');
        return NextResponse.json(
          { error: 'Updated workflow must have a path from start node' },
          { status: 400 }
        );
      }

      const firstEmployeeNode = workflow.nodes.find((n: any) => n.id === firstEdge.target);
      if (!firstEmployeeNode || firstEmployeeNode.type !== 'employee') {
        console.error('❌ First node after start is not an employee node');
        return NextResponse.json(
          { error: 'First node after start must be an employee node' },
          { status: 400 }
        );
      }

      // Prepare bulk update operations
      const bulkOps = activeTickets.map(ticket => {
        // Determine new assignees based on node type
        let newAssignee: string;
        let newAssignees: string[];
        let newGroupLead: string | null = null;

        if (firstEmployeeNode.data.nodeType === 'parallel' && firstEmployeeNode.data.groupMembers) {
          // Group node
          newGroupLead = firstEmployeeNode.data.groupLead || firstEmployeeNode.data.employeeId;
          const members = [...firstEmployeeNode.data.groupMembers];
          if (!members.includes(newGroupLead)) {
            members.push(newGroupLead);
          }
          newAssignees = members;
          newAssignee = newGroupLead;
        } else {
          // Single assignee node
          newAssignee = firstEmployeeNode.data.employeeId;
          newAssignees = [firstEmployeeNode.data.employeeId];
        }

        // Create history entry
        const historyEntry = {
          actionType: 'forwarded' as const,
          performedBy: {
            userId: 'system',
            name: 'System (Workflow Updated)'
          },
          performedAt: new Date(),
          fromNode: ticket.workflowStage,
          toNode: firstEmployeeNode.id,
          explanation: `Workflow was updated. Ticket reset to start of new workflow.`
        };

        return {
          updateOne: {
            filter: { _id: ticket._id },
            update: {
              $set: {
                status: 'pending',
                workflowStage: firstEmployeeNode.id,
                currentAssignee: newAssignee,
                currentAssignees: newAssignees,
                groupLead: newGroupLead,
                updatedAt: new Date()
              },
              $push: {
                workflowHistory: historyEntry
              }
            }
          }
        };
      });

      // Execute bulk update
      const result = await Ticket.bulkWrite(bulkOps);
      console.log(`✅ Reset ${result.modifiedCount} tickets to pending status`);
    }

    return NextResponse.json({
      success: true,
      functionality,
      ticketsReset: activeTickets.length
    });
  } catch (error) {
    console.error('❌ Error updating functionality:', error);
    return NextResponse.json(
      { error: 'Failed to update functionality' },
      { status: 500 }
    );
  }
}

// DELETE - Delete functionality
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // ============================================
    // Check for non-closed tickets
    // ============================================
    
    // Count tickets that are NOT closed
    const activeTicketCount = await Ticket.countDocuments({
      functionality: id,
      status: { $ne: 'closed' }
    });

    console.log(`🔍 Found ${activeTicketCount} non-closed tickets for functionality ${id}`);

    if (activeTicketCount > 0) {
      console.log('❌ Cannot delete functionality with active tickets');
      return NextResponse.json(
        { 
          error: 'Cannot delete functionality with active tickets',
          message: `This functionality has ${activeTicketCount} ticket(s) that are not closed. All tickets must be closed before deletion.`,
          activeTicketCount
        },
        { status: 400 }
      );
    }

    // Proceed with deletion if no active tickets
    const functionality = await Functionality.findByIdAndDelete(id);
    
    if (!functionality) {
      return NextResponse.json(
        { error: 'Functionality not found' },
        { status: 404 }
      );
    }

    console.log('🗑️ Functionality deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Functionality deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting functionality:', error);
    return NextResponse.json(
      { error: 'Failed to delete functionality' },
      { status: 500 }
    );
  }
}