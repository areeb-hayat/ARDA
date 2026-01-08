// app/api/tickets/[id]/actions/route.ts
// COMPLETE VERSION with form_group support and SuperFunctionality support
// VERSION: 2025-01-07-WITH-SUPER-WORKFLOW

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Ticket from '@/models/Ticket';
import Functionality from '@/models/Functionality';
import SuperFunctionality from '@/models/SuperFunctionality';
import FormData from '@/models/FormData';

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
  console.log('\n🎯🎯🎯 ACTIONS ROUTE - VERSION 2025-01-07-WITH-SUPER-WORKFLOW 🎯🎯🎯\n');
  
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Get raw body text first for debugging
    const bodyText = await request.text();
    console.log('🔍 DEBUG - Raw request body text:', bodyText);
    
    // Parse the JSON
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    console.log('🔍 DEBUG - Parsed body:', JSON.stringify(body, null, 2));
    
    const { 
      action, 
      performedBy, 
      toNode, 
      explanation,
      reassignTo,
      blockerDescription,
      groupMembers,
      groupLead
    } = body;

    console.log(`\n🎬 TICKET ACTION: ${action}`);
    console.log(`Ticket ID: ${id}`);
    console.log(`performedBy object:`, performedBy);

    if (!action || !performedBy || !performedBy.userId || !performedBy.name) {
      console.error('❌ VALIDATION FAILED!');
      console.error('   action:', action);
      console.error('   performedBy:', performedBy);
      return NextResponse.json(
        { error: 'Missing required fields: action, performedBy (with userId and name)' },
        { status: 400 }
      );
    }

    console.log(`Performed by: ${performedBy.name} (${performedBy.userId})`);

    // Find ticket first
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Determine if this is a super workflow ticket
    const isSuper = ticket.department === 'Super Workflow';
    console.log(`🌟 Ticket type: ${isSuper ? 'Super Workflow' : 'Regular'}`);

    // Fetch the appropriate functionality
    let functionality: any;
    if (isSuper) {
      functionality = await SuperFunctionality.findById(ticket.functionality);
      console.log(`🌟 Loaded SuperFunctionality: ${functionality?.name}`);
    } else {
      functionality = await Functionality.findById(ticket.functionality);
      console.log(`📋 Loaded Functionality: ${functionality?.name}`);
    }

    if (!functionality || !functionality.workflow) {
      return NextResponse.json(
        { error: 'Functionality workflow not found' },
        { status: 400 }
      );
    }

    console.log(`Current stage: ${ticket.workflowStage}`);
    console.log(`Primary credit: ${ticket.primaryCredit?.name || 'None'}`);
    console.log(`Secondary credits: ${ticket.secondaryCredits.length}`);

    const isFirstNode = isFirstEmployeeNode(ticket.workflowStage, functionality.workflow);

    switch (action) {
      case 'in_progress':
      case 'mark_in_progress': {
        console.log('📝 Handling in_progress action');
        console.log(`   Is first node: ${isFirstNode}`);
        
        if (isFirstNode && !ticket.primaryCredit) {
          ticket.primaryCredit = {
            userId: performedBy.userId,
            name: performedBy.name
          };
          console.log(`✅ Gave PRIMARY credit to ${performedBy.name}`);
        } else if (!isFirstNode) {
          ticket.secondaryCredits = addSecondaryCredit(
            ticket.secondaryCredits,
            performedBy.userId,
            performedBy.name
          );
          console.log(`✅ Gave SECONDARY credit to ${performedBy.name}`);
        } else {
          console.log(`⏭️ PRIMARY already assigned, no credit change`);
        }

        ticket.status = 'in-progress';
        
        ticket.workflowHistory.push({
          actionType: 'in_progress',
          performedBy: {
            userId: performedBy.userId,
            name: performedBy.name
          },
          performedAt: new Date()
        });

        break;
      }

      case 'form_group': {
        console.log('\n👥 ========== FORM GROUP ACTION START ==========');
        
        if (!groupMembers || groupMembers.length < 2) {
          return NextResponse.json(
            { error: 'groupMembers array with at least 2 members (including lead) is required' },
            { status: 400 }
          );
        }

        if (!groupLead) {
          return NextResponse.json(
            { error: 'groupLead is required for form_group action' },
            { status: 400 }
          );
        }

        console.log(`Group lead: ${groupLead}`);
        console.log(`Group members (${groupMembers.length}):`, groupMembers.map((m: any) => m.name));
        console.log(`At first node: ${isFirstNode}`);

        // Extract user IDs from groupMembers
        const memberIds = groupMembers.map((m: any) => m.userId);
        
        // Update ticket to group assignment
        ticket.currentAssignee = groupLead;
        ticket.currentAssignees = memberIds;
        ticket.groupLead = groupLead;
        ticket.status = 'pending'; // Reset to pending for group to start

        // Give credits based on position
        if (isFirstNode) {
          // First node: Lead gets PRIMARY, others get SECONDARY
          console.log(`\n📝 AT FIRST NODE - Assigning credits`);
          
          const leadMember = groupMembers.find((m: any) => m.userId === groupLead);
          if (leadMember && !ticket.primaryCredit) {
            ticket.primaryCredit = {
              userId: groupLead,
              name: leadMember.name
            };
            console.log(`   ✅ PRIMARY credit: ${leadMember.name} (group lead)`);
          }

          // Other members get SECONDARY
          groupMembers.forEach((member: any) => {
            if (member.userId !== groupLead) {
              ticket.secondaryCredits = addSecondaryCredit(
                ticket.secondaryCredits,
                member.userId,
                member.name
              );
              console.log(`   ✅ SECONDARY credit: ${member.name}`);
            }
          });
        } else {
          // Not first node: Everyone gets SECONDARY
          console.log(`\n📝 NOT AT FIRST NODE - All get SECONDARY`);
          
          groupMembers.forEach((member: any) => {
            ticket.secondaryCredits = addSecondaryCredit(
              ticket.secondaryCredits,
              member.userId,
              member.name
            );
            console.log(`   ✅ SECONDARY credit: ${member.name}`);
          });
        }

        // Add to workflow history
        ticket.workflowHistory.push({
          actionType: 'group_formed',
          performedBy: {
            userId: performedBy.userId,
            name: performedBy.name
          },
          performedAt: new Date(),
          groupMembers: groupMembers.map((m: any) => ({
            userId: m.userId,
            name: m.name,
            isLead: m.userId === groupLead
          }))
        });

        console.log(`\n✅ Group formed successfully!`);
        console.log(`   Group lead: ${groupLead}`);
        console.log(`   Total members: ${memberIds.length}`);
        console.log(`   Primary credit: ${ticket.primaryCredit?.name || 'None'}`);
        console.log(`   Secondary credits: ${ticket.secondaryCredits.length}`);
        console.log('========== FORM GROUP ACTION END ==========\n');
        
        break;
      }

      case 'reassign': {
        console.log('\n🔄 ========== REASSIGN ACTION START ==========');
        
        if (!reassignTo || reassignTo.length === 0) {
          return NextResponse.json(
            { error: 'reassignTo is required for reassign action' },
            { status: 400 }
          );
        }

        console.log(`Performed by: ${performedBy.name} (${performedBy.userId})`);
        console.log(`Current workflow stage: ${ticket.workflowStage}`);
        console.log(`Reassigning to: ${reassignTo.join(', ')}`);

        const atFirstNode = isFirstEmployeeNode(ticket.workflowStage, functionality.workflow);
        console.log(`\n🔍 At first node: ${atFirstNode}`);
        console.log(`   Current PRIMARY credit: ${ticket.primaryCredit?.name || 'None'} (${ticket.primaryCredit?.userId || 'N/A'})`);
        console.log(`   Current SECONDARY credits: ${ticket.secondaryCredits.length}`);

        const newAssignees = await FormData.find({ _id: { $in: reassignTo } })
          .select('_id basicDetails.name username')
          .lean();

        if (newAssignees.length === 0) {
          return NextResponse.json(
            { error: 'New assignees not found' },
            { status: 400 }
          );
        }

        const firstNewAssignee = newAssignees[0];
        const newAssigneeName = (firstNewAssignee as any).basicDetails?.name || 
                               (firstNewAssignee as any).username || 'Unknown';
        const newAssigneeId = reassignTo[0];

        console.log(`\n👤 New assignee: ${newAssigneeName} (${newAssigneeId})`);

        if (atFirstNode) {
          console.log(`\n📝 AT FIRST NODE - Transferring PRIMARY credit`);
          console.log(`   Old PRIMARY: ${ticket.primaryCredit?.name || 'None'} (${ticket.primaryCredit?.userId || 'N/A'})`);
          
          ticket.primaryCredit = {
            userId: newAssigneeId,
            name: newAssigneeName
          };
          
          console.log(`   New PRIMARY: ${newAssigneeName} (${newAssigneeId})`);
          console.log(`   ✅ PRIMARY credit transferred!`);
        } else {
          console.log(`\n📝 NOT AT FIRST NODE - Updating SECONDARY credits`);
          console.log(`   Removing performer from SECONDARY: ${performedBy.name} (${performedBy.userId})`);
          
          const beforeCount = ticket.secondaryCredits.length;
          ticket.secondaryCredits = ticket.secondaryCredits.filter(
            c => c.userId !== performedBy.userId
          );
          const afterRemove = ticket.secondaryCredits.length;
          console.log(`   Removed ${beforeCount - afterRemove} entries`);
          
          newAssignees.forEach(assignee => {
            const assigneeId = assignee._id.toString();
            const assigneeName = (assignee as any).basicDetails?.name || 
                                (assignee as any).username || 'Unknown';
            
            ticket.secondaryCredits = addSecondaryCredit(
              ticket.secondaryCredits,
              assigneeId,
              assigneeName
            );
            console.log(`   Added to SECONDARY: ${assigneeName} (${assigneeId})`);
          });
          
          console.log(`   ✅ SECONDARY credits updated (total: ${ticket.secondaryCredits.length})`);
        }

        ticket.currentAssignee = newAssigneeId;
        ticket.currentAssignees = reassignTo;
        ticket.groupLead = null;
        ticket.status = 'pending';

        ticket.workflowHistory.push({
          actionType: 'reassigned',
          performedBy: {
            userId: performedBy.userId,
            name: performedBy.name
          },
          performedAt: new Date(),
          reassignedTo: reassignTo,
          explanation
        });

        console.log(`\n✅ Reassignment complete!`);
        console.log(`   Final PRIMARY: ${ticket.primaryCredit?.name || 'None'} (${ticket.primaryCredit?.userId || 'N/A'})`);
        console.log(`   Final SECONDARY: ${ticket.secondaryCredits.length} people`);
        ticket.secondaryCredits.forEach(c => console.log(`     - ${c.name} (${c.userId})`));
        console.log('========== REASSIGN ACTION END ==========\n');
        
        break;
      }

      case 'forward': {
        if (!toNode) {
          return NextResponse.json(
            { error: 'toNode is required for forward action' },
            { status: 400 }
          );
        }

        if (isFirstNode && !ticket.primaryCredit) {
          ticket.primaryCredit = {
            userId: performedBy.userId,
            name: performedBy.name
          };
          console.log(`✅ Gave PRIMARY credit to ${performedBy.name}`);
        } else if (!isFirstNode) {
          ticket.secondaryCredits = addSecondaryCredit(
            ticket.secondaryCredits,
            performedBy.userId,
            performedBy.name
          );
          console.log(`✅ Gave SECONDARY credit to ${performedBy.name}`);
        }

        const fromNode = ticket.workflowStage;
        const targetNode = functionality.workflow.nodes.find((n: any) => n.id === toNode);

        if (!targetNode) {
          return NextResponse.json(
            { error: 'Target node not found in workflow' },
            { status: 400 }
          );
        }

        console.log(`   Forwarding to: ${targetNode.data.label} (${targetNode.type})`);

        if (targetNode.type === 'end') {
          ticket.status = 'resolved';
          ticket.workflowStage = toNode;
          
          ticket.workflowHistory.push(
            {
              actionType: 'forwarded',
              performedBy: {
                userId: performedBy.userId,
                name: performedBy.name
              },
              performedAt: new Date(),
              fromNode,
              toNode,
              explanation
            },
            {
              actionType: 'resolved',
              performedBy: {
                userId: performedBy.userId,
                name: performedBy.name
              },
              performedAt: new Date()
            }
          );

          console.log('✅ Forwarded to END, marked as resolved');
          break;
        }

        const targetIsFirst = isFirstEmployeeNode(toNode, functionality.workflow);

        if (targetNode.data.nodeType === 'parallel') {
          const groupLead = targetNode.data.groupLead || targetNode.data.employeeId;
          const groupMembers = targetNode.data.groupMembers || [];
          
          console.log(`   Target is GROUP node (first: ${targetIsFirst})`);

          const allMembers = [groupLead, ...groupMembers.filter((m: string) => m !== groupLead)];
          const memberDetails = await FormData.find({ 
            _id: { $in: allMembers } 
          }).select('_id basicDetails.name username').lean();

          if (targetIsFirst) {
            const leadDoc = memberDetails.find(m => m._id.toString() === groupLead);
            if (leadDoc && !ticket.primaryCredit) {
              ticket.primaryCredit = {
                userId: groupLead,
                name: (leadDoc as any).basicDetails?.name || (leadDoc as any).username || 'Unknown'
              };
              console.log(`   ✅ Gave PRIMARY to group lead`);
            }

            memberDetails.forEach(member => {
              const memberId = member._id.toString();
              if (memberId !== groupLead) {
                const memberName = (member as any).basicDetails?.name || (member as any).username || 'Unknown';
                ticket.secondaryCredits = addSecondaryCredit(
                  ticket.secondaryCredits,
                  memberId,
                  memberName
                );
              }
            });
            console.log(`   ✅ Gave SECONDARY to ${memberDetails.length - 1} group members`);
          } else {
            memberDetails.forEach(member => {
              const memberId = member._id.toString();
              const memberName = (member as any).basicDetails?.name || (member as any).username || 'Unknown';
              ticket.secondaryCredits = addSecondaryCredit(
                ticket.secondaryCredits,
                memberId,
                memberName
              );
            });
            console.log(`   ✅ Gave SECONDARY to all ${memberDetails.length} group members`);
          }

          ticket.currentAssignee = groupLead;
          ticket.currentAssignees = allMembers;
          ticket.groupLead = groupLead;

          const groupMembersForHistory = memberDetails.map((emp: any) => ({
            userId: emp._id.toString(),
            name: emp.basicDetails?.name || emp.username,
            isLead: emp._id.toString() === groupLead
          }));

          ticket.workflowHistory.push({
            actionType: 'forwarded',
            performedBy: {
              userId: performedBy.userId,
              name: performedBy.name
            },
            performedAt: new Date(),
            fromNode,
            toNode,
            explanation,
            groupMembers: groupMembersForHistory
          });
        } else {
          const newAssigneeId = targetNode.data.employeeId;
          
          const newAssignee = await FormData.findById(newAssigneeId)
            .select('basicDetails.name username')
            .lean();

          if (newAssignee) {
            const newAssigneeName = (newAssignee as any).basicDetails?.name || (newAssignee as any).username;
            
            if (targetIsFirst && !ticket.primaryCredit) {
              ticket.primaryCredit = {
                userId: newAssigneeId,
                name: newAssigneeName
              };
              console.log(`   ✅ Gave PRIMARY to new assignee`);
            } else {
              ticket.secondaryCredits = addSecondaryCredit(
                ticket.secondaryCredits,
                newAssigneeId,
                newAssigneeName
              );
              console.log(`   ✅ Gave SECONDARY to new assignee`);
            }
          }

          ticket.currentAssignee = newAssigneeId;
          ticket.currentAssignees = [newAssigneeId];
          ticket.groupLead = null;

          ticket.workflowHistory.push({
            actionType: 'forwarded',
            performedBy: {
              userId: performedBy.userId,
              name: performedBy.name
            },
            performedAt: new Date(),
            fromNode,
            toNode,
            explanation
          });
        }

        ticket.workflowStage = toNode;
        ticket.status = 'pending';
        break;
      }

      case 'blocker_reported':
      case 'report_blocker': {
        if (!blockerDescription) {
          return NextResponse.json(
            { error: 'blockerDescription is required' },
            { status: 400 }
          );
        }

        if (isFirstNode && !ticket.primaryCredit) {
          ticket.primaryCredit = {
            userId: performedBy.userId,
            name: performedBy.name
          };
        } else if (!isFirstNode) {
          ticket.secondaryCredits = addSecondaryCredit(
            ticket.secondaryCredits,
            performedBy.userId,
            performedBy.name
          );
        }

        ticket.status = 'blocked';
        ticket.blockers.push({
          description: blockerDescription,
          reportedBy: performedBy.userId,
          reportedByName: performedBy.name,
          reportedAt: new Date(),
          isResolved: false
        });

        ticket.workflowHistory.push({
          actionType: 'blocker_reported',
          performedBy: {
            userId: performedBy.userId,
            name: performedBy.name
          },
          performedAt: new Date(),
          blockerDescription
        });

        console.log(`✅ Blocker reported, credit given`);
        break;
      }

      case 'blocker_resolved': {
        if (isFirstNode && !ticket.primaryCredit) {
          ticket.primaryCredit = {
            userId: performedBy.userId,
            name: performedBy.name
          };
        } else if (!isFirstNode) {
          ticket.secondaryCredits = addSecondaryCredit(
            ticket.secondaryCredits,
            performedBy.userId,
            performedBy.name
          );
        }

        if (ticket.blockers.length > 0) {
          const latestBlocker = ticket.blockers[ticket.blockers.length - 1];
          latestBlocker.isResolved = true;
          latestBlocker.resolvedBy = performedBy.userId;
          latestBlocker.resolvedByName = performedBy.name;
          latestBlocker.resolvedAt = new Date();
        }

        ticket.status = 'in-progress';

        ticket.workflowHistory.push({
          actionType: 'blocker_resolved',
          performedBy: {
            userId: performedBy.userId,
            name: performedBy.name
          },
          performedAt: new Date()
        });

        console.log(`✅ Blocker resolved, credit given`);
        break;
      }

      case 'resolve': {
        if (isFirstNode && !ticket.primaryCredit) {
          ticket.primaryCredit = {
            userId: performedBy.userId,
            name: performedBy.name
          };
        } else if (!isFirstNode) {
          ticket.secondaryCredits = addSecondaryCredit(
            ticket.secondaryCredits,
            performedBy.userId,
            performedBy.name
          );
        }

        ticket.status = 'resolved';

        ticket.workflowHistory.push({
          actionType: 'resolved',
          performedBy: {
            userId: performedBy.userId,
            name: performedBy.name
          },
          performedAt: new Date()
        });

        console.log(`✅ Resolved, credit given`);
        break;
      }

      case 'close': {
        ticket.status = 'closed';

        ticket.workflowHistory.push({
          actionType: 'closed',
          performedBy: {
            userId: performedBy.userId,
            name: performedBy.name
          },
          performedAt: new Date()
        });

        console.log('✅ Closed (no credit change)');
        break;
      }

      case 'reopen': {
        if (!toNode) {
          return NextResponse.json(
            { error: 'toNode is required for reopen action' },
            { status: 400 }
          );
        }

        const targetNode = functionality.workflow.nodes.find((n: any) => n.id === toNode);

        if (!targetNode) {
          return NextResponse.json(
            { error: 'Target node not found' },
            { status: 400 }
          );
        }

        ticket.workflowStage = toNode;
        ticket.status = 'pending';

        ticket.workflowHistory.push({
          actionType: 'reopened',
          performedBy: {
            userId: performedBy.userId,
            name: performedBy.name
          },
          performedAt: new Date(),
          toNode,
          explanation
        });

        console.log('✅ Reopened (no credit change)');
        break;
      }

      default:
        console.error(`❌ Unknown action: ${action}`);
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    await ticket.save();

    console.log(`\n📊 FINAL CREDITS AFTER ACTION:`);
    console.log(`   Primary: ${ticket.primaryCredit?.name || 'None'} (${ticket.primaryCredit?.userId || 'N/A'})`);
    console.log(`   Secondary: ${ticket.secondaryCredits.length} people`);
    ticket.secondaryCredits.forEach(c => console.log(`     - ${c.name} (${c.userId})`));
    console.log('✅ Action completed successfully\n');

    return NextResponse.json({
      success: true,
      ticket: {
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        workflowStage: ticket.workflowStage,
        currentAssignees: ticket.currentAssignees,
        groupLead: ticket.groupLead,
        primaryCredit: ticket.primaryCredit,
        secondaryCredits: ticket.secondaryCredits
      }
    });

  } catch (error) {
    console.error('❌ Error processing ticket action:', error);
    return NextResponse.json(
      { error: 'Failed to process action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}