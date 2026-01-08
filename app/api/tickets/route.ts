// ===== app/api/tickets/route.ts (UPDATED TO SUPPORT SUPER FUNCTIONALITIES) =====
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Ticket from '@/models/Ticket';
import Functionality from '@/models/Functionality';
import SuperFunctionality from '@/models/SuperFunctionality';
import FormData from '@/models/FormData';
import { sendTicketAssignmentEmail } from '@/app/utils/sendTicketNotification';
import { saveAttachment } from '@/app/utils/fileUpload';

// GET - Get tickets created by user
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get('createdBy');
    const status = searchParams.get('status');

    if (!createdBy) {
      return NextResponse.json(
        { error: 'createdBy parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching tickets created by userId:', createdBy);

    // Validate ObjectId format
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(createdBy);
    
    let userObjectId = createdBy;
    if (!isObjectId) {
      console.log('📝 Input is username, looking up ObjectId from FormData...');
      const formData = await FormData.findOne({ username: createdBy }).select('_id').lean();
      
      if (!formData) {
        console.error('❌ FormData not found for username:', createdBy);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      userObjectId = formData._id.toString();
      console.log('✅ Found ObjectId in FormData:', userObjectId);
    }

    // Build query
    const query: any = {
      'raisedBy.userId': userObjectId
    };

    // Apply status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    console.log('📋 Query:', JSON.stringify(query, null, 2));

    const tickets = await Ticket.find(query)
      .populate('functionality', 'name workflow department')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${tickets.length} tickets created by user (ObjectId: ${userObjectId})`);

    // Format tickets for frontend
    const formattedTickets = tickets.map(ticket => ({
      ...ticket,
      _id: ticket._id.toString(),
      functionality: ticket.functionality ? {
        ...ticket.functionality,
        _id: ticket.functionality._id.toString()
      } : null
    }));

    return NextResponse.json({
      success: true,
      tickets: formattedTickets,
      count: formattedTickets.length
    });
  } catch (error) {
    console.error('❌ Error fetching tickets:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      });
    }
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new ticket (supports both Functionality and SuperFunctionality)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { functionalityId, formData, raisedBy, isSuper } = body;

    console.log('🎫 Creating ticket with data:', {
      functionalityId,
      isSuper,
      raisedBy,
      formDataKeys: Object.keys(formData || {}),
      attachments: formData?.['default-attachments']
    });

    // Validation
    if (!functionalityId) {
      return NextResponse.json(
        { error: 'Functionality ID is required' },
        { status: 400 }
      );
    }

    if (!raisedBy || !raisedBy.userId || !raisedBy.name) {
      return NextResponse.json(
        { error: 'raisedBy information is required (userId, name)' },
        { status: 400 }
      );
    }

    // Fetch functionality based on type
    let functionality: any;
    let department: string;
    
    if (isSuper) {
      console.log('🌟 Fetching SuperFunctionality...');
      functionality = await SuperFunctionality.findById(functionalityId);
      department = 'Super Workflow'; // Super workflows are cross-departmental
    } else {
      console.log('📋 Fetching regular Functionality...');
      functionality = await Functionality.findById(functionalityId);
      department = functionality?.department;
    }
    
    if (!functionality) {
      return NextResponse.json(
        { error: `${isSuper ? 'Super functionality' : 'Functionality'} not found` },
        { status: 404 }
      );
    }

    console.log('✅ Found functionality:', functionality.name, isSuper ? '(Super)' : '(Regular)');

    // Get workflow
    const workflow = functionality.workflow;
    
    if (!workflow || !workflow.nodes || !workflow.edges) {
      return NextResponse.json(
        { error: 'Functionality does not have a valid workflow' },
        { status: 400 }
      );
    }

    // Find start node
    const startNode = workflow.nodes.find((n: any) => n.type === 'start');
    if (!startNode) {
      return NextResponse.json(
        { error: 'Workflow does not have a start node' },
        { status: 400 }
      );
    }

    // Find first employee node
    const firstEdge = workflow.edges.find((e: any) => e.source === startNode.id);
    if (!firstEdge) {
      return NextResponse.json(
        { error: 'No workflow path from start node' },
        { status: 400 }
      );
    }

    const firstEmployeeNode = workflow.nodes.find((n: any) => n.id === firstEdge.target);
    if (!firstEmployeeNode || firstEmployeeNode.type !== 'employee') {
      return NextResponse.json(
        { error: 'First node after start must be an employee node' },
        { status: 400 }
      );
    }

    console.log('✅ Found first employee node:', {
      nodeId: firstEmployeeNode.id,
      nodeType: firstEmployeeNode.data?.nodeType,
      employeeId: firstEmployeeNode.data?.employeeId
    });

    // Determine assignees and initialize credits
    let currentAssignee: string;
    let currentAssignees: string[];
    let groupLead: string | null = null;
    let primaryCredit: { userId: string; name: string } | null = null;
    let secondaryCredits: Array<{ userId: string; name: string }> = [];

    if (firstEmployeeNode.data.nodeType === 'parallel' && firstEmployeeNode.data.groupMembers) {
      // First node is a GROUP
      groupLead = firstEmployeeNode.data.groupLead || firstEmployeeNode.data.employeeId;
      const members = [...firstEmployeeNode.data.groupMembers];
      if (!members.includes(groupLead)) {
        members.push(groupLead);
      }
      currentAssignees = members;
      currentAssignee = groupLead;
      
      console.log('👥 Assigning to group (FIRST NODE):', {
        groupLead,
        members: currentAssignees
      });

      // Get member details
      const memberDocs = await FormData.find({ _id: { $in: currentAssignees } })
        .select('_id basicDetails.name username')
        .lean();

      // Group lead gets PRIMARY credit
      const leadDoc = memberDocs.find(m => m._id.toString() === groupLead);
      if (leadDoc) {
        primaryCredit = {
          userId: groupLead,
          name: (leadDoc as any).basicDetails?.name || (leadDoc as any).username || 'Unknown'
        };
        console.log(`✅ PRIMARY credit: ${primaryCredit.name} (group lead)`);
      }

      // Group members get SECONDARY credit
      memberDocs.forEach((doc: any) => {
        const memberId = doc._id.toString();
        if (memberId !== groupLead) {
          secondaryCredits.push({
            userId: memberId,
            name: doc.basicDetails?.name || doc.username || 'Unknown'
          });
        }
      });
      console.log(`✅ SECONDARY credit: ${secondaryCredits.length} group members`);
      
    } else {
      // First node is SINGLE ASSIGNEE
      currentAssignee = firstEmployeeNode.data.employeeId;
      currentAssignees = [firstEmployeeNode.data.employeeId];
      
      console.log('👤 Assigning to single employee (FIRST NODE):', currentAssignee);

      // Get employee details
      const employeeDoc = await FormData.findById(currentAssignee)
        .select('basicDetails.name username')
        .lean();

      if (employeeDoc) {
        const employeeName = (employeeDoc as any).basicDetails?.name || (employeeDoc as any).username || 'Unknown';
        
        // Single assignee at first node gets PRIMARY credit
        primaryCredit = {
          userId: currentAssignee,
          name: employeeName
        };

        console.log(`✅ PRIMARY credit: ${employeeName}`);
      }
    }

    // Generate ticket number
    const year = new Date().getFullYear();
    const count = await Ticket.countDocuments({
      ticketNumber: new RegExp(`^TKT-${year}-`)
    });
    const ticketNumber = `TKT-${year}-${String(count + 1).padStart(6, '0')}`;

    // ============================================
    // 💾 SAVE ATTACHMENTS TO DISK
    // ============================================
    if (formData['default-attachments']) {
      try {
        console.log('📎 Processing attachments:', formData['default-attachments']);
        
        const attachmentData = formData['default-attachments'];
        const savedPaths: string[] = [];
        
        // Handle array of files
        if (Array.isArray(attachmentData)) {
          for (const item of attachmentData) {
            // Check if it's a proper file object with data
            if (item && typeof item === 'object' && (item.data || item.content) && item.name) {
              try {
                const fileData = item.data || item.content;
                const savedPath = saveAttachment(ticketNumber, {
                  name: item.name,
                  data: fileData,
                  type: item.type || item.mimeType || 'application/octet-stream'
                });
                savedPaths.push(savedPath);
                console.log(`✅ Saved: ${item.name} → ${savedPath}`);
              } catch (fileError) {
                console.error(`❌ Failed to save ${item.name}:`, fileError);
              }
            } else {
              console.warn('⚠️ Invalid file object (missing data):', typeof item === 'object' ? JSON.stringify(item).substring(0, 100) : item);
            }
          }
        }
        // Handle single file object
        else if (typeof attachmentData === 'object' && (attachmentData.data || attachmentData.content) && attachmentData.name) {
          try {
            const fileData = attachmentData.data || attachmentData.content;
            const savedPath = saveAttachment(ticketNumber, {
              name: attachmentData.name,
              data: fileData,
              type: attachmentData.type || attachmentData.mimeType || 'application/octet-stream'
            });
            savedPaths.push(savedPath);
            console.log(`✅ Saved: ${attachmentData.name} → ${savedPath}`);
          } catch (fileError) {
            console.error(`❌ Failed to save file:`, fileError);
          }
        }
        else {
          console.warn('⚠️ Attachment data is not in expected format. Received:', typeof attachmentData === 'string' ? attachmentData : JSON.stringify(attachmentData).substring(0, 200));
        }
        
        // Replace file data with paths
        if (savedPaths.length > 0) {
          formData['default-attachments'] = savedPaths;
          console.log(`✅ Stored ${savedPaths.length} file path(s) in formData`);
        } else {
          formData['default-attachments'] = [];
          console.log('⚠️ No valid attachments saved - check frontend file upload');
        }
        
      } catch (attachmentError) {
        console.error('❌ Attachment processing failed:', attachmentError);
        formData['default-attachments'] = [];
      }
    } else {
      console.log('ℹ️ No attachments in request');
    }
    // ============================================

    // Determine priority
    let priority = 'medium';
    if (formData['default-urgency']) {
      const urgency = formData['default-urgency'].toLowerCase();
      if (urgency === 'low') priority = 'low';
      else if (urgency === 'high') priority = 'high';
      else if (urgency === 'critical') priority = 'critical';
      else priority = 'medium';
    }

    // Create ticket
    const ticket = new Ticket({
      ticketNumber,
      functionalityName: functionality.name,
      functionality: functionalityId,
      department,
      raisedBy: {
        userId: String(raisedBy.userId),
        name: raisedBy.name,
        email: raisedBy.email
      },
      formData,
      priority,
      status: 'pending',
      workflowStage: firstEmployeeNode.id,
      currentAssignee,
      currentAssignees,
      groupLead,
      primaryCredit,
      secondaryCredits,
      contributors: [],
      blockers: [],
      workflowHistory: [
        {
          actionType: 'forwarded',
          performedBy: {
            userId: String(raisedBy.userId),
            name: raisedBy.name
          },
          performedAt: new Date(),
          fromNode: startNode.id,
          toNode: firstEmployeeNode.id,
          explanation: groupLead 
            ? `Ticket created and assigned to group (Lead: PRIMARY, ${secondaryCredits.length} members: SECONDARY)`
            : 'Ticket created and assigned to first employee (PRIMARY)'
        }
      ]
    });

    await ticket.save();

    console.log(`✅ Ticket created: ${ticketNumber} → ${primaryCredit?.name || currentAssignee}`);
    console.log(`📋 FormData attachments:`, ticket.formData['default-attachments']);

    // ============================================
    // ✨ SEND EMAIL NOTIFICATION
    // ============================================
    try {
      const ticketForEmail = ticket.toObject();
      
      // Send to primary assignee
      await sendTicketAssignmentEmail(ticketForEmail, FormData);
      
      // Send to group members if applicable
      if (groupLead && currentAssignees.length > 1) {
        for (const memberId of currentAssignees) {
          if (memberId !== groupLead) {
            try {
              const memberTicket = { ...ticketForEmail, currentAssignee: memberId };
              await sendTicketAssignmentEmail(memberTicket, FormData);
            } catch (err) {
              // Silent fail for individual group members
            }
          }
        }
      }
    } catch (emailError) {
      console.error(`❌ Email failed: ${ticketNumber}`);
    }
    // ============================================

    return NextResponse.json({
      success: true,
      ticket: {
        _id: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating ticket:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'Failed to create ticket', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}