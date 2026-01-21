// app/api/tickets/[id]/form-group/route.ts
// VERSION: 2025-01-19-WITH-EMAIL-NOTIFICATIONS
// Adds email notifications when group is formed

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Ticket from '@/models/Ticket';
import FormData from '@/models/FormData';
import { sendGroupFormedEmail } from '@/app/utils/sendTicketNotification';

function isFirstEmployeeNode(nodeId: string, workflow: any): boolean {
  const startNode = workflow.nodes.find((n: any) => n.type === 'start');
  if (!startNode) return false;
  
  const firstEdge = workflow.edges.find((e: any) => e.source === startNode.id);
  if (!firstEdge) return false;
  
  return firstEdge.target === nodeId;
}

function addSecondaryCredit(secondaryCredits: any[], userId: string, name: string) {
  const exists = secondaryCredits.some(c => c.userId === userId);
  if (!exists) {
    secondaryCredits.push({ userId, name });
  }
  return secondaryCredits;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n👥 FORM GROUP ROUTE - WITH EMAIL NOTIFICATIONS\n');
  
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    
    console.log('🔍 Form group request:', JSON.stringify(body, null, 2));
    
    const { 
      performedBy, 
      groupLead, 
      groupMembers,
      explanation
    } = body;

    // Validate required fields
    if (!performedBy || !performedBy.userId || !performedBy.name) {
      return NextResponse.json(
        { error: 'performedBy (with userId and name) is required' },
        { status: 400 }
      );
    }

    if (!groupLead) {
      return NextResponse.json(
        { error: 'groupLead is required' },
        { status: 400 }
      );
    }

    if (!groupMembers || groupMembers.length === 0) {
      return NextResponse.json(
        { error: 'groupMembers array is required' },
        { status: 400 }
      );
    }

    console.log(`Group Lead: ${performedBy.name} (${performedBy.userId})`);
    console.log(`Group Members: ${groupMembers.join(', ')}`);

    const ticket = await Ticket.findById(id).populate('functionality');
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const functionality = ticket.functionality as any;
    if (!functionality || !functionality.workflow) {
      return NextResponse.json(
        { error: 'Functionality workflow not found' },
        { status: 400 }
      );
    }

    console.log(`\nCurrent stage: ${ticket.workflowStage}`);
    console.log(`Current status: ${ticket.status}`);

    // Check if already in a group
    if (ticket.currentAssignees && ticket.currentAssignees.length > 1) {
      return NextResponse.json(
        { error: 'Ticket is already assigned to a group' },
        { status: 400 }
      );
    }

    // Check if at first node for credit assignment
    const isFirstNode = isFirstEmployeeNode(ticket.workflowStage, functionality.workflow);
    console.log(`Is first node: ${isFirstNode}`);

    // Get all member details
    const allMemberIds = [groupLead, ...groupMembers];
    const memberDetails = await FormData.find({ 
      _id: { $in: allMemberIds } 
    }).select('_id basicDetails.name username').lean();

    if (memberDetails.length === 0) {
      return NextResponse.json(
        { error: 'No valid group members found' },
        { status: 400 }
      );
    }

    console.log(`\nFound ${memberDetails.length} member details`);

    // Assign credits based on node position
    if (isFirstNode) {
      // At first node: Lead gets PRIMARY, others get SECONDARY
      const leadDoc = memberDetails.find(m => m._id.toString() === groupLead);
      if (leadDoc) {
        ticket.primaryCredit = {
          userId: groupLead,
          name: (leadDoc as any).basicDetails?.name || (leadDoc as any).username || 'Unknown'
        };
        console.log(`✅ Gave PRIMARY credit to lead: ${ticket.primaryCredit.name}`);
      }

      // Add all other members as secondary
      memberDetails.forEach(member => {
        const memberId = member._id.toString();
        if (memberId !== groupLead) {
          const memberName = (member as any).basicDetails?.name || (member as any).username || 'Unknown';
          ticket.secondaryCredits = addSecondaryCredit(
            ticket.secondaryCredits,
            memberId,
            memberName
          );
          console.log(`✅ Gave SECONDARY credit to: ${memberName}`);
        }
      });
    } else {
      // Not at first node: ALL members get SECONDARY credit
      memberDetails.forEach(member => {
        const memberId = member._id.toString();
        const memberName = (member as any).basicDetails?.name || (member as any).username || 'Unknown';
        ticket.secondaryCredits = addSecondaryCredit(
          ticket.secondaryCredits,
          memberId,
          memberName
        );
        console.log(`✅ Gave SECONDARY credit to: ${memberName}`);
      });
    }

    // Update ticket group assignments
    ticket.currentAssignee = groupLead;
    ticket.currentAssignees = allMemberIds;
    ticket.groupLead = groupLead;
    
    // Keep status as-is or set to in-progress if pending
    if (ticket.status === 'pending') {
      ticket.status = 'in-progress';
    }

    // Build group members for history
    const groupMembersForHistory = memberDetails.map((emp: any) => ({
      userId: emp._id.toString(),
      name: emp.basicDetails?.name || emp.username || 'Unknown',
      isLead: emp._id.toString() === groupLead
    }));

    // Add to workflow history
    ticket.workflowHistory.push({
      actionType: 'group_formed',
      performedBy: {
        userId: performedBy.userId,
        name: performedBy.name
      },
      performedAt: new Date(),
      explanation: explanation || 'Group formed at current stage',
      groupMembers: groupMembersForHistory
    });

    await ticket.save();

    console.log(`\n✅ GROUP FORMED SUCCESSFULLY!`);
    console.log(`   Lead: ${performedBy.name}`);
    console.log(`   Members: ${allMemberIds.length} total`);

    // 📧 SEND EMAIL NOTIFICATIONS
    try {
      const ticketObject = ticket.toObject();
      await sendGroupFormedEmail(ticketObject, performedBy, groupMembersForHistory, FormData);
      console.log('✅ Group formation emails sent to all members');
    } catch (emailError) {
      console.error('❌ Group formation emails failed:', emailError);
    }

    console.log('\n');

    return NextResponse.json({
      success: true,
      ticket: {
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        workflowStage: ticket.workflowStage,
        currentAssignee: ticket.currentAssignee,
        currentAssignees: ticket.currentAssignees,
        groupLead: ticket.groupLead,
        primaryCredit: ticket.primaryCredit,
        secondaryCredits: ticket.secondaryCredits
      }
    });

  } catch (error) {
    console.error('❌ Error forming group:', error);
    return NextResponse.json(
      { 
        error: 'Failed to form group', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}