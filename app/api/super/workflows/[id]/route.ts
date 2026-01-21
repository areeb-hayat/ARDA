// ============================================
// app/api/super/workflows/[id]/route.ts
// FIXED: No longer adds default fields on update
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import SuperFunctionality from '@/models/SuperFunctionality';
import Ticket from '@/models/Ticket';

// GET - Fetch single super functionality
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const functionality = await SuperFunctionality.findById(id).lean();
    
    if (!functionality) {
      return NextResponse.json(
        { error: 'Super functionality not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      functionality
    });
  } catch (error) {
    console.error('❌ Error fetching super functionality:', error);
    return NextResponse.json(
      { error: 'Failed to fetch super functionality' },
      { status: 500 }
    );
  }
}

// PUT - Update super functionality
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    const { name, description, workflow, formSchema, accessControl } = body;

    console.log('✏️ Updating super functionality:', {
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

    if (accessControl) {
      updateData.accessControl = accessControl;
    }

    const functionality = await SuperFunctionality.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!functionality) {
      return NextResponse.json(
        { error: 'Super functionality not found' },
        { status: 404 }
      );
    }

    console.log('✅ Super functionality updated successfully:', {
      id: functionality._id,
      formSchemaFieldCount: functionality.formSchema?.fields?.length || 0
    });

    // Reset active tickets to pending/start
    const activeTickets = await Ticket.find({
      functionality: id,
      status: { $nin: ['resolved', 'closed'] }
    });

    console.log(`🎫 Found ${activeTickets.length} active tickets to reset`);

    if (activeTickets.length > 0) {
      const startNode = workflow.nodes.find((n: any) => n.type === 'start');
      const firstEdge = workflow.edges.find((e: any) => e.source === startNode?.id);
      const firstEmployeeNode = workflow.nodes.find((n: any) => n.id === firstEdge?.target);

      if (firstEmployeeNode) {
        let newAssignee: string;
        let newAssignees: string[];
        let newGroupLead: string | null = null;

        if (firstEmployeeNode.data.nodeType === 'parallel' && firstEmployeeNode.data.groupMembers) {
          newGroupLead = firstEmployeeNode.data.groupLead || firstEmployeeNode.data.employeeId;
          const members = [...firstEmployeeNode.data.groupMembers];
          if (!members.includes(newGroupLead)) {
            members.push(newGroupLead);
          }
          newAssignees = members;
          newAssignee = newGroupLead;
        } else {
          newAssignee = firstEmployeeNode.data.employeeId;
          newAssignees = [firstEmployeeNode.data.employeeId];
        }

        const bulkOps = activeTickets.map(ticket => ({
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
                workflowHistory: {
                  actionType: 'forwarded',
                  performedBy: {
                    userId: 'system',
                    name: 'System (Workflow Updated)'
                  },
                  performedAt: new Date(),
                  fromNode: ticket.workflowStage,
                  toNode: firstEmployeeNode.id,
                  explanation: 'Workflow was updated. Ticket reset to start of new workflow.'
                }
              }
            }
          }
        }));

        const result = await Ticket.bulkWrite(bulkOps);
        console.log(`✅ Reset ${result.modifiedCount} tickets`);
      }
    }

    return NextResponse.json({
      success: true,
      functionality,
      ticketsReset: activeTickets.length
    });
  } catch (error) {
    console.error('❌ Error updating super functionality:', error);
    return NextResponse.json(
      { error: 'Failed to update super functionality' },
      { status: 500 }
    );
  }
}

// DELETE - Delete super functionality
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Check for non-closed tickets
    const activeTicketCount = await Ticket.countDocuments({
      functionality: id,
      status: { $ne: 'closed' }
    });

    if (activeTicketCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete super functionality with active tickets',
          message: `This super functionality has ${activeTicketCount} ticket(s) that are not closed. All tickets must be closed before deletion.`,
          activeTicketCount
        },
        { status: 400 }
      );
    }

    const functionality = await SuperFunctionality.findByIdAndDelete(id);
    
    if (!functionality) {
      return NextResponse.json(
        { error: 'Super functionality not found' },
        { status: 404 }
      );
    }

    console.log('🗑️ Super functionality deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Super functionality deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting super functionality:', error);
    return NextResponse.json(
      { error: 'Failed to delete super functionality' },
      { status: 500 }
    );
  }
}