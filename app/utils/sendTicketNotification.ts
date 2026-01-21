// utils/sendTicketNotification.ts
import sendEmail from './sendEmail';
import { buildTicketDetailsTable, buildEmailTemplate, buildWorkflowHistoryTable } from './ticketEmailTemplates';
import type { Model } from 'mongoose';
import fs from 'fs';
import path from 'path';

/**
 * Fetches user email from FormData collection
 * @param userIdentifier - Username or ObjectId to lookup
 * @param FormDataModel - Mongoose FormData model
 * @returns { email, name } or null if not found
 */
export const getUserEmail = async (userIdentifier: string, FormDataModel: Model<any>): Promise<{ email: string; name: string } | null> => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(userIdentifier);
    const query = isObjectId ? { _id: userIdentifier } : { username: userIdentifier };

    const userData = await FormDataModel.findOne(query)
      .select('contactInformation.email basicDetails.name username')
      .lean();

    if (userData?.contactInformation?.email) {
      return {
        email: userData.contactInformation.email,
        name: userData.basicDetails?.name || userData.username || userIdentifier,
      };
    }
    
    console.warn(`⚠️  No email: ${userIdentifier}`);
    return null;
  } catch (error) {
    console.error(`❌ Email lookup failed: ${userIdentifier}`);
    return null;
  }
};

/**
 * Process attachments from form data AND workflow history
 * @param formData - The ticket form data
 * @param workflowHistory - The ticket workflow history
 * @returns Array of attachment objects for nodemailer
 */
const processAllAttachments = (formData: Record<string, any>, workflowHistory: any[] = []): Array<{ filename: string; path: string }> => {
  const attachments: Array<{ filename: string; path: string }> = [];
  const seenPaths = new Set<string>();
  
  console.log('📎 Processing ALL attachments (form data + workflow history)...');
  
  // Helper function to resolve and add attachment
  const resolveAndAddAttachment = (filePath: string, source: string) => {
    if (typeof filePath !== 'string' || !filePath.trim()) return;
    
    // Skip corrupted data
    if (filePath.includes('=====') || filePath.includes('appapi') || 
        filePath.length > 500 || filePath.includes('\n') || 
        filePath.includes('UPDAT.txt')) {
      console.warn(`   ⚠️  Skipped (invalid): ${filePath.substring(0, 50)}...`);
      return;
    }

    try {
      let fullPath = filePath;
      
      // Handle relative paths (uploads/tickets/...)
      if (filePath.match(/^uploads[\\\/]/i)) {
        fullPath = `D:\\${filePath}`;
      }
      // If path starts with D:\ already, use as is
      else if (filePath.match(/^[A-Za-z]:\\/)) {
        fullPath = filePath;
      }
      // If path starts with \Uploads or /Uploads, add D:
      else if (filePath.match(/^[\\\/]Uploads/i)) {
        fullPath = `D:${filePath}`;
      }
      // If path is just a filename, assume D:\Uploads\
      else if (!filePath.includes('\\') && !filePath.includes('/')) {
        fullPath = `D:\\Uploads\\${filePath}`;
      }
      // Otherwise, assume it's relative from D:
      else {
        fullPath = `D:\\${filePath}`;
      }
      
      // Normalize path separators
      fullPath = fullPath.replace(/\//g, '\\');
      
      // Skip duplicates
      if (seenPaths.has(fullPath)) {
        console.log(`   ⏭️  Already added: ${path.basename(fullPath)}`);
        return;
      }
      
      // Check if file exists
      if (fs.existsSync(fullPath)) {
        attachments.push({
          filename: path.basename(fullPath),
          path: fullPath,
        });
        seenPaths.add(fullPath);
        console.log(`   ✅ Attached (${source}): ${path.basename(fullPath)}`);
      } else {
        console.warn(`   ⚠️  File not found: ${fullPath}`);
        
        // Try alternate locations
        const alternates = [
          `D:\\${filePath}`,
          `D:\\Uploads\\${path.basename(filePath)}`,
          filePath.replace(/\\/g, '/'),
        ];
        
        for (const altPath of alternates) {
          if (fs.existsSync(altPath)) {
            if (!seenPaths.has(altPath)) {
              attachments.push({
                filename: path.basename(altPath),
                path: altPath,
              });
              seenPaths.add(altPath);
              console.log(`   ✅ Found at alternate (${source}): ${altPath}`);
            }
            return;
          }
        }
      }
    } catch (error) {
      console.warn(`   ⚠️  Error processing: ${error}`);
    }
  };
  
  // 1. Process form data attachments
  Object.entries(formData || {}).forEach(([key, value]) => {
    if (key.toLowerCase().includes('attachment') && value) {
      const files = Array.isArray(value) ? value : [value];
      files.forEach((filePath: any) => {
        resolveAndAddAttachment(filePath, 'form');
      });
    }
  });
  
  // 2. Process workflow history attachments
  (workflowHistory || []).forEach((entry: any, index: number) => {
    if (entry.attachments && Array.isArray(entry.attachments)) {
      entry.attachments.forEach((filePath: string) => {
        resolveAndAddAttachment(filePath, `history-${index + 1}`);
      });
    }
  });
  
  console.log(`📎 Total unique attachments: ${attachments.length}`);
  return attachments;
};

/**
 * Sends ticket assignment notification (initial assignment)
 */
export const sendTicketAssignmentEmail = async (ticket: any, FormDataModel: Model<any>): Promise<void> => {
  try {
    const assigneeData = await getUserEmail(ticket.currentAssignee, FormDataModel);
    if (!assigneeData?.email) return;

    // Fetch functionality to get field labels
    let functionality = null;
    try {
      const mongoose = require('mongoose');
      const Functionality = mongoose.models.Functionality || mongoose.model('Functionality');
      const SuperFunctionality = mongoose.models.SuperFunctionality || mongoose.model('SuperFunctionality');
      
      const isSuper = ticket.department === 'Super Workflow';
      if (isSuper) {
        functionality = await SuperFunctionality.findById(ticket.functionality).lean();
      } else {
        functionality = await Functionality.findById(ticket.functionality).lean();
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch functionality labels');
    }

    const ticketDetailsTable = buildTicketDetailsTable(ticket, functionality);
    const workflowHistoryTable = buildWorkflowHistoryTable(ticket.workflowHistory);
    
    const emailHtml = buildEmailTemplate({
      recipientName: assigneeData.name,
      subject: `New Ticket Assigned: ${ticket.ticketNumber}`,
      greeting: `Hi ${assigneeData.name},`,
      mainMessage: `
        <p style="margin: 0 0 8px 0;">You've been assigned a new ticket.</p>
        <p style="margin: 0;"><strong>${ticket.functionalityName}</strong> • Priority: <strong style="color: ${getPriorityColor(ticket.priority)};">${ticket.priority.toUpperCase()}</strong></p>
      `,
      detailsTable: ticketDetailsTable,
      workflowHistoryTable,
      actionRequired: 'Please review and take necessary action.',
      closingMessage: 'For questions, contact the ticket creator or your team lead.',
    });

    const attachments = processAllAttachments(ticket.formData, ticket.workflowHistory);

    await sendEmail(
      assigneeData.email,
      `New Ticket Assigned: ${ticket.ticketNumber}`,
      `You have been assigned ticket ${ticket.ticketNumber}`,
      emailHtml,
      attachments
    );
    
    console.log(`✅ Assignment email sent to ${assigneeData.name}`);
  } catch (error) {
    console.error(`❌ Assignment email failed: ${ticket.ticketNumber}`, error);
  }
};

/**
 * Sends ticket forwarded notification
 */
export const sendTicketForwardedEmail = async (
  ticket: any,
  performedBy: { userId: string; name: string },
  explanation: string,
  FormDataModel: Model<any>
): Promise<void> => {
  try {
    // Send to new assignee
    const assigneeData = await getUserEmail(ticket.currentAssignee, FormDataModel);
    if (!assigneeData?.email) return;

    // Fetch functionality
    let functionality = null;
    try {
      const mongoose = require('mongoose');
      const Functionality = mongoose.models.Functionality || mongoose.model('Functionality');
      const SuperFunctionality = mongoose.models.SuperFunctionality || mongoose.model('SuperFunctionality');
      
      const isSuper = ticket.department === 'Super Workflow';
      if (isSuper) {
        functionality = await SuperFunctionality.findById(ticket.functionality).lean();
      } else {
        functionality = await Functionality.findById(ticket.functionality).lean();
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch functionality labels');
    }

    const ticketDetailsTable = buildTicketDetailsTable(ticket, functionality);
    const workflowHistoryTable = buildWorkflowHistoryTable(ticket.workflowHistory);
    
    const emailHtml = buildEmailTemplate({
      recipientName: assigneeData.name,
      subject: `Ticket Forwarded: ${ticket.ticketNumber}`,
      greeting: `Hi ${assigneeData.name},`,
      mainMessage: `
        <p style="margin: 0 0 8px 0;">A ticket has been forwarded to you by <strong>${performedBy.name}</strong>.</p>
        ${explanation ? `<p style="margin: 8px 0 0 0; padding: 12px; background: #f3f4f6; border-left: 3px solid #6366f1; border-radius: 4px; font-style: italic; color: #4b5563;">"${explanation}"</p>` : ''}
      `,
      detailsTable: ticketDetailsTable,
      workflowHistoryTable,
      actionRequired: 'Please review and take necessary action.',
    });

    const attachments = processAllAttachments(ticket.formData, ticket.workflowHistory);

    await sendEmail(
      assigneeData.email,
      `Ticket Forwarded: ${ticket.ticketNumber}`,
      `Ticket ${ticket.ticketNumber} forwarded to you by ${performedBy.name}`,
      emailHtml,
      attachments
    );
    
    console.log(`✅ Forward email sent to ${assigneeData.name}`);
    
    // If forwarded to a group, send to all members
    if (ticket.currentAssignees && ticket.currentAssignees.length > 1) {
      for (const memberId of ticket.currentAssignees) {
        if (memberId !== ticket.currentAssignee) {
          try {
            const memberData = await getUserEmail(memberId, FormDataModel);
            if (memberData?.email) {
              await sendEmail(
                memberData.email,
                `Ticket Forwarded (Group): ${ticket.ticketNumber}`,
                `Ticket ${ticket.ticketNumber} forwarded to your group`,
                emailHtml,
                attachments
              );
              console.log(`✅ Forward email sent to group member: ${memberData.name}`);
            }
          } catch (err) {
            console.warn(`⚠️  Failed to send to group member ${memberId}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Forward email failed: ${ticket.ticketNumber}`, error);
  }
};

/**
 * Sends ticket reassigned notification
 */
export const sendTicketReassignedEmail = async (
  ticket: any,
  performedBy: { userId: string; name: string },
  explanation: string | undefined,
  FormDataModel: Model<any>
): Promise<void> => {
  try {
    const assigneeData = await getUserEmail(ticket.currentAssignee, FormDataModel);
    if (!assigneeData?.email) return;

    // Fetch functionality
    let functionality = null;
    try {
      const mongoose = require('mongoose');
      const Functionality = mongoose.models.Functionality || mongoose.model('Functionality');
      const SuperFunctionality = mongoose.models.SuperFunctionality || mongoose.model('SuperFunctionality');
      
      const isSuper = ticket.department === 'Super Workflow';
      if (isSuper) {
        functionality = await SuperFunctionality.findById(ticket.functionality).lean();
      } else {
        functionality = await Functionality.findById(ticket.functionality).lean();
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch functionality labels');
    }

    const ticketDetailsTable = buildTicketDetailsTable(ticket, functionality);
    const workflowHistoryTable = buildWorkflowHistoryTable(ticket.workflowHistory);
    
    const emailHtml = buildEmailTemplate({
      recipientName: assigneeData.name,
      subject: `Ticket Reassigned: ${ticket.ticketNumber}`,
      greeting: `Hi ${assigneeData.name},`,
      mainMessage: `
        <p style="margin: 0 0 8px 0;">A ticket has been reassigned to you by <strong>${performedBy.name}</strong>.</p>
        ${explanation ? `<p style="margin: 8px 0 0 0; padding: 12px; background: #f3f4f6; border-left: 3px solid #8b5cf6; border-radius: 4px; font-style: italic; color: #4b5563;">"${explanation}"</p>` : ''}
      `,
      detailsTable: ticketDetailsTable,
      workflowHistoryTable,
      actionRequired: 'Please review and take necessary action.',
    });

    const attachments = processAllAttachments(ticket.formData, ticket.workflowHistory);

    await sendEmail(
      assigneeData.email,
      `Ticket Reassigned: ${ticket.ticketNumber}`,
      `Ticket ${ticket.ticketNumber} reassigned to you`,
      emailHtml,
      attachments
    );
    
    console.log(`✅ Reassignment email sent to ${assigneeData.name}`);
  } catch (error) {
    console.error(`❌ Reassignment email failed: ${ticket.ticketNumber}`, error);
  }
};

/**
 * Sends group formation notification
 */
export const sendGroupFormedEmail = async (
  ticket: any,
  performedBy: { userId: string; name: string },
  groupMembers: Array<{ userId: string; name: string; isLead: boolean }>,
  FormDataModel: Model<any>
): Promise<void> => {
  try {
    // Fetch functionality
    let functionality = null;
    try {
      const mongoose = require('mongoose');
      const Functionality = mongoose.models.Functionality || mongoose.model('Functionality');
      const SuperFunctionality = mongoose.models.SuperFunctionality || mongoose.model('SuperFunctionality');
      
      const isSuper = ticket.department === 'Super Workflow';
      if (isSuper) {
        functionality = await SuperFunctionality.findById(ticket.functionality).lean();
      } else {
        functionality = await Functionality.findById(ticket.functionality).lean();
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch functionality labels');
    }

    const ticketDetailsTable = buildTicketDetailsTable(ticket, functionality);
    const workflowHistoryTable = buildWorkflowHistoryTable(ticket.workflowHistory);
    
    const groupMembersList = groupMembers.map(m => 
      `<li style="margin: 4px 0;">${m.name}${m.isLead ? ' <strong>(Lead)</strong>' : ''}</li>`
    ).join('');
    
    // Send to all group members
    for (const member of groupMembers) {
      try {
        const memberData = await getUserEmail(member.userId, FormDataModel);
        if (!memberData?.email) continue;
        
        const emailHtml = buildEmailTemplate({
          recipientName: memberData.name,
          subject: `Group Formed for Ticket: ${ticket.ticketNumber}`,
          greeting: `Hi ${memberData.name},`,
          mainMessage: `
            <p style="margin: 0 0 8px 0;">A group has been formed for ticket <strong>${ticket.ticketNumber}</strong> by <strong>${performedBy.name}</strong>.</p>
            <p style="margin: 8px 0 0 0;"><strong>Group Members:</strong></p>
            <ul style="margin: 4px 0; padding-left: 20px;">
              ${groupMembersList}
            </ul>
            ${member.isLead ? '<p style="margin: 8px 0 0 0; padding: 8px; background: #dbeafe; border-left: 3px solid #3b82f6; border-radius: 4px; color: #1e40af;"><strong>You are the group lead</strong></p>' : ''}
          `,
          detailsTable: ticketDetailsTable,
          workflowHistoryTable,
          actionRequired: member.isLead ? 'As group lead, please coordinate with team members.' : 'Please coordinate with your group lead.',
        });

        const attachments = processAllAttachments(ticket.formData, ticket.workflowHistory);

        await sendEmail(
          memberData.email,
          `Group Formed for Ticket: ${ticket.ticketNumber}`,
          `You are part of a group for ticket ${ticket.ticketNumber}`,
          emailHtml,
          attachments
        );
        
        console.log(`✅ Group formation email sent to ${memberData.name}`);
      } catch (err) {
        console.warn(`⚠️  Failed to send to group member ${member.name}`);
      }
    }
  } catch (error) {
    console.error(`❌ Group formation email failed: ${ticket.ticketNumber}`, error);
  }
};

/**
 * Sends ticket reverted notification
 */
export const sendTicketRevertedEmail = async (
  ticket: any,
  performedBy: { userId: string; name: string },
  revertMessage: string,
  FormDataModel: Model<any>
): Promise<void> => {
  try {
    const assigneeData = await getUserEmail(ticket.currentAssignee, FormDataModel);
    if (!assigneeData?.email) return;

    // Fetch functionality
    let functionality = null;
    try {
      const mongoose = require('mongoose');
      const Functionality = mongoose.models.Functionality || mongoose.model('Functionality');
      const SuperFunctionality = mongoose.models.SuperFunctionality || mongoose.model('SuperFunctionality');
      
      const isSuper = ticket.department === 'Super Workflow';
      if (isSuper) {
        functionality = await SuperFunctionality.findById(ticket.functionality).lean();
      } else {
        functionality = await Functionality.findById(ticket.functionality).lean();
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch functionality labels');
    }

    const ticketDetailsTable = buildTicketDetailsTable(ticket, functionality);
    const workflowHistoryTable = buildWorkflowHistoryTable(ticket.workflowHistory);
    
    const emailHtml = buildEmailTemplate({
      recipientName: assigneeData.name,
      subject: `Ticket Reverted: ${ticket.ticketNumber}`,
      greeting: `Hi ${assigneeData.name},`,
      mainMessage: `
        <p style="margin: 0 0 8px 0;">Ticket <strong>${ticket.ticketNumber}</strong> has been reverted back to you by <strong>${performedBy.name}</strong>.</p>
        <p style="margin: 8px 0 0 0; padding: 12px; background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px; color: #92400e;"><strong>Reason for revert:</strong><br/>"${revertMessage}"</p>
      `,
      detailsTable: ticketDetailsTable,
      workflowHistoryTable,
      actionRequired: 'Please address the issues mentioned and resubmit.',
    });

    const attachments = processAllAttachments(ticket.formData, ticket.workflowHistory);

    await sendEmail(
      assigneeData.email,
      `Ticket Reverted: ${ticket.ticketNumber}`,
      `Ticket ${ticket.ticketNumber} reverted to you`,
      emailHtml,
      attachments
    );
    
    console.log(`✅ Revert email sent to ${assigneeData.name}`);
    
    // If reverted to a group, send to all members
    if (ticket.currentAssignees && ticket.currentAssignees.length > 1) {
      for (const memberId of ticket.currentAssignees) {
        if (memberId !== ticket.currentAssignee) {
          try {
            const memberData = await getUserEmail(memberId, FormDataModel);
            if (memberData?.email) {
              await sendEmail(
                memberData.email,
                `Ticket Reverted (Group): ${ticket.ticketNumber}`,
                `Ticket ${ticket.ticketNumber} reverted to your group`,
                emailHtml,
                attachments
              );
              console.log(`✅ Revert email sent to group member: ${memberData.name}`);
            }
          } catch (err) {
            console.warn(`⚠️  Failed to send to group member ${memberId}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Revert email failed: ${ticket.ticketNumber}`, error);
  }
};

/**
 * Sends ticket resolution notification to creator
 */
export const sendTicketResolvedEmail = async (
  ticket: any,
  resolvedBy: { userId: string; name: string },
  FormDataModel: Model<any>
): Promise<void> => {
  try {
    const creatorEmail = ticket.raisedBy?.email;
    if (!creatorEmail) return;

    // Fetch functionality
    let functionality = null;
    try {
      const mongoose = require('mongoose');
      const Functionality = mongoose.models.Functionality || mongoose.model('Functionality');
      const SuperFunctionality = mongoose.models.SuperFunctionality || mongoose.model('SuperFunctionality');
      
      const isSuper = ticket.department === 'Super Workflow';
      if (isSuper) {
        functionality = await SuperFunctionality.findById(ticket.functionality).lean();
      } else {
        functionality = await Functionality.findById(ticket.functionality).lean();
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch functionality labels');
    }

    const ticketDetailsTable = buildTicketDetailsTable(ticket, functionality);
    const workflowHistoryTable = buildWorkflowHistoryTable(ticket.workflowHistory);

    const emailHtml = buildEmailTemplate({
      recipientName: ticket.raisedBy.name,
      subject: `Ticket Resolved: ${ticket.ticketNumber}`,
      greeting: `Hi ${ticket.raisedBy.name},`,
      mainMessage: `
        <p style="margin: 0 0 8px 0;">Your ticket <strong>${ticket.ticketNumber}</strong> has been resolved by <strong>${resolvedBy.name}</strong>.</p>
        <div style="margin: 12px 0; padding: 12px; background: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 4px;">
          <p style="margin: 0; color: #166534; font-weight: 600;">✓ Resolution Complete</p>
          <p style="margin: 4px 0 0 0; color: #166534; font-size: 13px;">Your request has been successfully processed.</p>
        </div>
      `,
      detailsTable: ticketDetailsTable,
      workflowHistoryTable,
      closingMessage: 'If you have concerns about this resolution, please contact the resolver or reopen the ticket.',
    });

    await sendEmail(
      creatorEmail,
      `Ticket Resolved: ${ticket.ticketNumber}`,
      `Your ticket ${ticket.ticketNumber} has been resolved`,
      emailHtml
    );
    
    console.log(`✅ Resolution email sent to ${ticket.raisedBy.name}`);
  } catch (error) {
    console.error(`❌ Resolution email failed: ${ticket.ticketNumber}`, error);
  }
};

/**
 * Helper function to get priority color
 */
const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };
  return colors[priority] || '#6b7280';
};

export default {
  sendTicketAssignmentEmail,
  sendTicketForwardedEmail,
  sendTicketReassignedEmail,
  sendGroupFormedEmail,
  sendTicketRevertedEmail,
  sendTicketResolvedEmail,
  getUserEmail,
};