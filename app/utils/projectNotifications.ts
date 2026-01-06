// app/utils/projectNotifications.ts
import sendEmail from './sendEmail';
import FormData from '@/models/FormData';
import fs from 'fs';

/**
 * Get user email from FormData
 */
async function getUserEmail(userId: string): Promise<{ email: string; name: string } | null> {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    const query = isObjectId ? { _id: userId } : { username: userId };

    const userData = await FormData.findOne(query)
      .select('contactInformation.email basicDetails.name username')
      .lean();

    if (userData?.contactInformation?.email) {
      return {
        email: userData.contactInformation.email,
        name: userData.basicDetails?.name || userData.username || userId,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Email lookup failed: ${userId}`);
    return null;
  }
}

/**
 * Process attachments
 */
function processAttachments(attachments: string[]): Array<{ filename: string; path: string }> {
  const result: Array<{ filename: string; path: string }> = [];
  
  attachments.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      result.push({
        filename: filePath.split('\\').pop() || 'attachment',
        path: filePath,
      });
    }
  });
  
  return result;
}

/**
 * Build project details HTML
 */
function buildProjectDetails(project: any): string {
  const healthColors: Record<string, string> = {
    healthy: '#10b981',
    'at-risk': '#f59e0b',
    delayed: '#f97316',
    critical: '#ef4444',
  };
  const healthColor = healthColors[project.health] || '#6b7280';

  return `
    <table style="width:100%; border-collapse:collapse; font-family: system-ui; margin: 20px 0;">
      <tr>
        <td style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white; font-size: 18px;">${project.projectNumber}</h2>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">${project.title}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #6b7280; font-size: 12px;">Status</span><br/>
                <span style="color: #111827; font-weight: 600;">${project.status.toUpperCase()}</span>
              </td>
              <td style="padding: 8px 0;">
                <span style="color: #6b7280; font-size: 12px;">Health</span><br/>
                <span style="color: ${healthColor}; font-weight: 600;">${project.health.toUpperCase()}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Build sprint details HTML
 */
function buildSprintDetails(sprint: any): string {
  const healthColors: Record<string, string> = {
    healthy: '#10b981',
    'at-risk': '#f59e0b',
    delayed: '#f97316',
    critical: '#ef4444',
  };
  const healthColor = healthColors[sprint.health] || '#6b7280';

  return `
    <table style="width:100%; border-collapse:collapse; font-family: system-ui; margin: 20px 0;">
      <tr>
        <td style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white; font-size: 18px;">${sprint.sprintNumber}</h2>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">${sprint.title}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #6b7280; font-size: 12px;">Status</span><br/>
                <span style="color: #111827; font-weight: 600;">${sprint.status.toUpperCase()}</span>
              </td>
              <td style="padding: 8px 0;">
                <span style="color: #6b7280; font-size: 12px;">Health</span><br/>
                <span style="color: ${healthColor}; font-weight: 600;">${sprint.health.toUpperCase()}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Build email template
 */
function buildEmailTemplate(params: {
  recipientName: string;
  subject: string;
  mainMessage: string;
  detailsHtml: string;
  actionRequired?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${params.subject}</title>
    </head>
    <body style="font-family: system-ui; background-color: #f3f4f6; padding: 20px;">
      <table style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 24px;">
            <h1 style="margin: 0; font-size: 20px;">Hi ${params.recipientName},</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 20px 24px;">
            ${params.mainMessage}
          </td>
        </tr>
        ${params.actionRequired ? `
        <tr>
          <td style="padding: 0 24px 20px 24px;">
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px;">
              <strong style="color: #92400e;">⚡ Action Required</strong>
              <p style="margin: 4px 0 0 0; color: #78350f;">${params.actionRequired}</p>
            </div>
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 0 24px;">
            ${params.detailsHtml}
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; font-weight: 500;">Best regards,</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">ARDA Project Management</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Send project notification
 */
export async function sendProjectNotification(
  project: any,
  action: string,
  performedBy: string,
  performedByName: string
): Promise<void> {
  try {
    const activeMembers = project.members.filter((m: any) => !m.leftAt);
    const recipients = activeMembers.map((m: any) => m.userId);

    for (const userId of recipients) {
      if (userId === performedBy) continue;

      const userData = await getUserEmail(userId);
      if (!userData?.email) continue;

      let subject = '';
      let mainMessage = '';
      let actionRequired = '';

      switch (action) {
        case 'created':
          subject = `New Project: ${project.projectNumber}`;
          mainMessage = `<p>You've been assigned to a new project by <strong>${performedByName}</strong>.</p>`;
          actionRequired = 'Please review the project details and deliverables.';
          break;
        case 'add-member':
          subject = `Added to Project: ${project.projectNumber}`;
          mainMessage = `<p>You've been added to the project by <strong>${performedByName}</strong>.</p>`;
          break;
        case 'complete':
          subject = `Project Completed: ${project.projectNumber}`;
          mainMessage = `<p>The project has been marked complete by <strong>${performedByName}</strong>.</p>`;
          break;
      }

      const emailHtml = buildEmailTemplate({
        recipientName: userData.name,
        subject,
        mainMessage,
        detailsHtml: buildProjectDetails(project),
        actionRequired
      });

      await sendEmail(
        userData.email,
        subject,
        `Project notification: ${project.projectNumber}`,
        emailHtml
      );
    }
  } catch (error) {
    console.error('❌ Failed to send project notification');
  }
}

/**
 * Send deliverable notification
 */
export async function sendDeliverableNotification(
  project: any,
  deliverable: any,
  action: string,
  performedBy: string,
  performedByName: string
): Promise<void> {
  try {
    const recipients = deliverable.assignedTo;

    for (const userId of recipients) {
      if (userId === performedBy) continue;

      const userData = await getUserEmail(userId);
      if (!userData?.email) continue;

      let subject = `Deliverable Update: ${project.projectNumber}`;
      let mainMessage = `<p>Deliverable "<strong>${deliverable.title}</strong>" has been updated by <strong>${performedByName}</strong>.</p>`;
      
      const emailHtml = buildEmailTemplate({
        recipientName: userData.name,
        subject,
        mainMessage,
        detailsHtml: buildProjectDetails(project)
      });

      const attachments = processAttachments(deliverable.attachments || []);

      await sendEmail(
        userData.email,
        subject,
        `Deliverable update: ${deliverable.title}`,
        emailHtml,
        attachments
      );
    }
  } catch (error) {
    console.error('❌ Failed to send deliverable notification');
  }
}

/**
 * Send sprint notification
 */
export async function sendSprintNotification(
  sprint: any,
  action: string,
  performedBy: string,
  performedByName: string
): Promise<void> {
  try {
    const activeMembers = sprint.members.filter((m: any) => !m.leftAt);
    const recipients = activeMembers.map((m: any) => m.userId);

    for (const userId of recipients) {
      if (userId === performedBy) continue;

      const userData = await getUserEmail(userId);
      if (!userData?.email) continue;

      let subject = '';
      let mainMessage = '';

      switch (action) {
        case 'created':
          subject = `New Sprint: ${sprint.sprintNumber}`;
          mainMessage = `<p>You've been assigned to a new sprint by <strong>${performedByName}</strong>.</p>`;
          break;
        case 'completed':
          subject = `Sprint Completed: ${sprint.sprintNumber}`;
          mainMessage = `<p>The sprint has been marked complete by <strong>${performedByName}</strong>.</p>`;
          break;
      }

      const emailHtml = buildEmailTemplate({
        recipientName: userData.name,
        subject,
        mainMessage,
        detailsHtml: buildSprintDetails(sprint)
      });

      await sendEmail(
        userData.email,
        subject,
        `Sprint notification: ${sprint.sprintNumber}`,
        emailHtml
      );
    }
  } catch (error) {
    console.error('❌ Failed to send sprint notification');
  }
}

export default {
  sendProjectNotification,
  sendDeliverableNotification,
  sendSprintNotification
};