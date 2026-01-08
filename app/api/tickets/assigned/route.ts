// ===== app/api/tickets/assigned/route.ts =====
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Ticket from '@/models/Ticket';
import Functionality from '@/models/Functionality';
import SuperFunctionality from '@/models/SuperFunctionality';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching assigned tickets for userId:', userId);

    // Build query
    const query: any = {
      $or: [
        { currentAssignee: userId },
        { currentAssignees: { $in: [userId] } }
      ],
      status: { $nin: ['closed'] }
    };

    // Apply status filter if provided
    if (status && status !== 'all') {
      // Map widget status names to actual schema status values
      const statusArray = status.split(',').map(s => {
        const normalized = s.trim().toLowerCase();
        // Map common status aliases to actual schema values
        if (normalized === 'open' || normalized === 'new' || normalized === 'assigned') {
          return 'pending';
        }
        if (normalized === 'in progress') {
          return 'in-progress';
        }
        return normalized;
      });
      
      // Remove duplicates and filter out 'closed'
      const uniqueStatuses = [...new Set(statusArray)].filter(s => s !== 'closed');
      
      if (uniqueStatuses.length > 0) {
        query.status = { $in: uniqueStatuses };
      }
    }

    console.log('📋 Query:', JSON.stringify(query, null, 2));

    // Uses compound indexes:
    // - { currentAssignee: 1, status: 1, createdAt: -1 }
    // - { currentAssignees: 1, status: 1, createdAt: -1 }
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${tickets.length} assigned tickets`);

    // Manually fetch functionality for each ticket (handles both types)
    const ticketsWithFunctionality = await Promise.all(
      tickets.map(async (ticket) => {
        const isSuper = ticket.department === 'Super Workflow';
        
        let functionality = null;
        try {
          if (isSuper) {
            functionality = await SuperFunctionality.findById(ticket.functionality)
              .select('name workflow formSchema department')
              .lean();
            console.log(`🌟 Fetched SuperFunctionality for ticket ${ticket.ticketNumber}:`, {
              name: functionality?.name,
              hasWorkflow: !!functionality?.workflow,
              workflowNodes: functionality?.workflow?.nodes?.length,
              workflowEdges: functionality?.workflow?.edges?.length
            });
          } else {
            functionality = await Functionality.findById(ticket.functionality)
              .select('name workflow formSchema department')
              .lean();
            console.log(`📋 Fetched Functionality for ticket ${ticket.ticketNumber}:`, {
              name: functionality?.name,
              hasWorkflow: !!functionality?.workflow
            });
          }
        } catch (err) {
          console.error(`❌ Error fetching functionality for ticket ${ticket.ticketNumber}:`, err);
        }

        return {
          ...ticket,
          _id: ticket._id.toString(),
          title: ticket.functionalityName, // Add title field for widget
          functionality: functionality ? {
            _id: functionality._id,
            name: functionality.name,
            department: isSuper ? 'Super Workflow' : functionality.department,
            workflow: functionality.workflow,
            formSchema: functionality.formSchema
          } : null
        };
      })
    );

    console.log(`✅ Returning ${ticketsWithFunctionality.length} tickets with functionality data`);

    return NextResponse.json({
      success: true,
      tickets: ticketsWithFunctionality,
      count: ticketsWithFunctionality.length
    });
  } catch (error) {
    console.error('❌ Error fetching assigned tickets:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tickets', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}