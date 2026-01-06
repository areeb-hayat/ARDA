// utils/sendTicketNotification.ts
import sendEmail from './sendEmail';
import { buildTicketDetailsTable, buildEmailTemplate } from './ticketEmailTemplates';
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
 * Process attachments from form data
 * @param formData - The ticket form data
 * @returns Array of attachment objects for nodemailer
 */
const processAttachments = (formData: Record<string, any>): Array<{ filename: string; path: string }> => {
  const attachments: Array<{ filename: string; path: string }> = [];
  
  console.log('📎 Processing attachments from form data...');
  
  // Look for attachment fields in form data
  Object.entries(formData).forEach(([key, value]) => {
    if (key.toLowerCase().includes('attachment') && value) {
      console.log(`   Found attachment field: ${key} = ${JSON.stringify(value)}`);
      
      // Handle both single file and array of files
      const files = Array.isArray(value) ? value : [value];
      
      files.forEach((filePath: any, index: number) => {
        console.log(`   Processing file ${index + 1}: "${filePath}"`);
        
        if (typeof filePath === 'string' && filePath.trim()) {
          // Skip if it looks like corrupted data or paste error
          if (filePath.includes('=====') || 
              filePath.includes('appapi') || 
              filePath.length > 500 ||
              filePath.includes('\n') ||
              filePath.includes('UPDAT.txt')) {
            console.warn(`   ⚠️  Skipped (invalid): ${filePath.substring(0, 50)}...`);
            return;
          }

          try {
            let fullPath = filePath;
            
            // If path starts with D:\ already, use as is
            if (filePath.match(/^[A-Za-z]:\\/)) {
              fullPath = filePath;
            }
            // If path starts with \Uploads or /Uploads, add D:
            else if (filePath.match(/^[\\\/]Uploads/i)) {
              fullPath = `D:${filePath}`;
            }
            // If path starts with Uploads, add D:\
            else if (filePath.match(/^Uploads/i)) {
              fullPath = `D:\\${filePath}`;
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
            
            console.log(`   Resolved path: ${fullPath}`);
            
            // Check if file exists
            if (fs.existsSync(fullPath)) {
              attachments.push({
                filename: path.basename(fullPath),
                path: fullPath,
              });
              console.log(`   ✅ Attached: ${path.basename(fullPath)}`);
            } else {
              console.warn(`   ⚠️  File not found: ${fullPath}`);
              // Try alternate locations
              const alternates = [
                `D:\\${filePath}`,
                `D:\\Uploads\\${path.basename(filePath)}`,
                filePath.replace(/\\/g, '/'),
              ];
              console.log(`   Trying alternate paths: ${alternates.join(', ')}`);
              
              for (const altPath of alternates) {
                if (fs.existsSync(altPath)) {
                  attachments.push({
                    filename: path.basename(altPath),
                    path: altPath,
                  });
                  console.log(`   ✅ Found at alternate path: ${altPath}`);
                  return;
                }
              }
            }
          } catch (error) {
            console.warn(`   ⚠️  Error processing: ${error}`);
          }
        }
      });
    }
  });
  
  console.log(`📎 Total attachments: ${attachments.length}`);
  return attachments;
};

/**
 * Sends ticket assignment notification
 * @param ticket - The ticket object
 * @param FormDataModel - Mongoose FormData model
 * @returns Promise<void>
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
      functionality = await Functionality.findById(ticket.functionality).lean();
    } catch (error) {
      console.warn('⚠️  Could not fetch functionality labels');
    }

    // Build email content
    const ticketDetailsTable = buildTicketDetailsTable(ticket, functionality);
    const emailHtml = buildEmailTemplate({
      recipientName: assigneeData.name,
      subject: `New Ticket: ${ticket.ticketNumber}`,
      greeting: `Hi ${assigneeData.name},`,
      mainMessage: `
        <p style="margin: 0 0 8px 0;">You've been assigned a new ticket.</p>
        <p style="margin: 0;"><strong>${ticket.functionalityName}</strong> • Priority: <strong style="color: ${getPriorityColor(ticket.priority)};">${ticket.priority.toUpperCase()}</strong></p>
      `,
      detailsTable: ticketDetailsTable,
      actionRequired: 'Please review and take necessary action.',
      closingMessage: 'For questions, contact the ticket creator or your team lead.',
    });

    // Process attachments
    const attachments = processAttachments(ticket.formData);

    // Send email
    await sendEmail(
      assigneeData.email,
      `New Ticket: ${ticket.ticketNumber}`,
      `You have been assigned ticket ${ticket.ticketNumber}`,
      emailHtml,
      attachments
    );
  } catch (error) {
    console.error(`❌ Email failed: ${ticket.ticketNumber}`);
  }
};

/**
 * Sends ticket forwarding notification to new assignee
 */
export const sendTicketForwardedEmail = async (
  ticket: any,
  forwardedBy: string,
  comment: string,
  FormDataModel: Model<any>
): Promise<void> => {
  try {
    const assigneeData = await getUserEmail(ticket.currentAssignee, FormDataModel);
    const forwarderData = await getUserEmail(forwardedBy, FormDataModel);

    if (!assigneeData?.email) return;

    // Fetch functionality to get field labels
    let functionality = null;
    try {
      const mongoose = require('mongoose');
      const Functionality = mongoose.models.Functionality || mongoose.model('Functionality');
      functionality = await Functionality.findById(ticket.functionality).lean();
    } catch (error) {
      console.warn('⚠️  Could not fetch functionality labels');
    }

    const ticketDetailsTable = buildTicketDetailsTable(ticket, functionality);
    const emailHtml = buildEmailTemplate({
      recipientName: assigneeData.name,
      subject: `Ticket Forwarded: ${ticket.ticketNumber}`,
      greeting: `Hi ${assigneeData.name},`,
      mainMessage: `
        <p style="margin: 0 0 8px 0;">A ticket has been forwarded to you by <strong>${forwarderData?.name || forwardedBy}</strong>.</p>
        ${comment ? `<p style="margin: 0; padding: 8px 12px; background: #f3f4f6; border-radius: 4px; font-style: italic; color: #4b5563;">"${comment}"</p>` : ''}
      `,
      detailsTable: ticketDetailsTable,
      actionRequired: 'Please review and take necessary action.',
    });

    const attachments = processAttachments(ticket.formData);

    await sendEmail(
      assigneeData.email,
      `Ticket Forwarded: ${ticket.ticketNumber}`,
      `Ticket ${ticket.ticketNumber} forwarded to you`,
      emailHtml,
      attachments
    );
  } catch (error) {
    console.error(`❌ Forward email failed: ${ticket.ticketNumber}`);
  }
};

/**
 * Sends ticket resolution notification to creator
 */
export const sendTicketResolvedEmail = async (
  ticket: any,
  resolvedBy: string,
  resolution: string,
  FormDataModel: Model<any>
): Promise<void> => {
  try {
    const creatorEmail = ticket.raisedBy?.email;
    if (!creatorEmail) return;

    const resolverData = await getUserEmail(resolvedBy, FormDataModel);
    
    // Fetch functionality to get field labels
    let functionality = null;
    try {
      const mongoose = require('mongoose');
      const Functionality = mongoose.models.Functionality || mongoose.model('Functionality');
      functionality = await Functionality.findById(ticket.functionality).lean();
    } catch (error) {
      console.warn('⚠️  Could not fetch functionality labels');
    }

    const ticketDetailsTable = buildTicketDetailsTable(ticket, functionality);

    const emailHtml = buildEmailTemplate({
      recipientName: ticket.raisedBy.name,
      subject: `Ticket Resolved: ${ticket.ticketNumber}`,
      greeting: `Hi ${ticket.raisedBy.name},`,
      mainMessage: `
        <p style="margin: 0 0 8px 0;">Your ticket has been resolved by <strong>${resolverData?.name || resolvedBy}</strong>.</p>
        ${resolution ? `<p style="margin: 0; padding: 8px 12px; background: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 4px; color: #166534;">${resolution}</p>` : ''}
      `,
      detailsTable: ticketDetailsTable,
      closingMessage: 'If you have concerns about this resolution, please contact the resolver or reopen the ticket.',
    });

    await sendEmail(
      creatorEmail,
      `Ticket Resolved: ${ticket.ticketNumber}`,
      `Your ticket ${ticket.ticketNumber} has been resolved`,
      emailHtml
    );
  } catch (error) {
    console.error(`❌ Resolution email failed: ${ticket.ticketNumber}`);
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
  sendTicketResolvedEmail,
  getUserEmail,
};