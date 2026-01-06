// ===== app/utils/appointmentNotifications.ts =====
import sendEmail from './sendEmail';
import FormData from '@/models/FormData';

/**
 * Get user email and name from FormData
 */
async function getUserInfo(username: string): Promise<{ email: string; name: string } | null> {
  try {
    const userData = await FormData.findOne({ username })
      .select('contactInformation.email basicDetails.name')
      .lean();

    if (userData?.contactInformation?.email) {
      return {
        email: userData.contactInformation.email,
        name: userData.basicDetails?.name || username,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Email lookup failed for user: ${username}`);
    return null;
  }
}

/**
 * Build appointment details HTML
 */
function buildAppointmentDetails(appointment: any): string {
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    accepted: '#10b981',
    declined: '#ef4444',
    'partially-accepted': '#3b82f6',
    cancelled: '#6b7280',
  };
  const statusColor = statusColors[appointment.status] || '#6b7280';

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `
    <table style="width:100%; border-collapse:collapse; font-family: system-ui; margin: 20px 0;">
      <tr>
        <td style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white; font-size: 18px;">${appointment.title}</h2>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">${appointment.type === 'group' ? 'Group Meeting' : 'Individual Meeting'}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; width: 50%;">
                <span style="color: #6b7280; font-size: 12px;">📅 Date</span><br/>
                <span style="color: #111827; font-weight: 600;">${formatDate(appointment.proposedDate)}</span>
              </td>
              <td style="padding: 8px 0; width: 50%;">
                <span style="color: #6b7280; font-size: 12px;">🕐 Time</span><br/>
                <span style="color: #111827; font-weight: 600;">${formatTime(appointment.proposedStartTime)} - ${formatTime(appointment.proposedEndTime)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #6b7280; font-size: 12px;">👤 Organizer</span><br/>
                <span style="color: #111827; font-weight: 600;">${appointment.creatorName}</span>
              </td>
              <td style="padding: 8px 0;">
                <span style="color: #6b7280; font-size: 12px;">Status</span><br/>
                <span style="color: ${statusColor}; font-weight: 600; text-transform: uppercase;">${appointment.status.replace('-', ' ')}</span>
              </td>
            </tr>
          </table>
          ${appointment.description ? `
          <div style="margin-top: 16px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
            <span style="color: #6b7280; font-size: 12px;">Description</span><br/>
            <span style="color: #111827;">${appointment.description}</span>
          </div>
          ` : ''}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Build participants list HTML
 */
function buildParticipantsList(participants: any[]): string {
  const statusIcons: Record<string, string> = {
    pending: '⏳',
    accepted: '✅',
    declined: '❌',
    'counter-proposed': '🔄',
  };

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    accepted: '#10b981',
    declined: '#ef4444',
    'counter-proposed': '#3b82f6',
  };

  return `
    <table style="width:100%; border-collapse:collapse; font-family: system-ui; margin: 20px 0;">
      <tr>
        <td style="padding: 12px 16px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px 8px 0 0;">
          <strong style="color: #111827; font-size: 14px;">👥 Participants (${participants.length})</strong>
        </td>
      </tr>
      ${participants.map(p => `
      <tr>
        <td style="padding: 12px 16px; background: white; border: 1px solid #e5e7eb; border-top: none;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #111827;">${p.name}</strong>
              <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">@${p.username}</span>
            </div>
            <div>
              <span style="color: ${statusColors[p.status]}; font-weight: 600; font-size: 12px;">
                ${statusIcons[p.status]} ${p.status.toUpperCase().replace('-', ' ')}
              </span>
            </div>
          </div>
          ${p.declineReason ? `
          <div style="margin-top: 8px; padding: 8px; background: #fef3c7; border-radius: 4px; border-left: 3px solid #f59e0b;">
            <span style="color: #92400e; font-size: 12px;"><strong>Reason:</strong> ${p.declineReason}</span>
          </div>
          ` : ''}
        </td>
      </tr>
      `).join('')}
    </table>
  `;
}

/**
 * Build history timeline HTML
 */
function buildHistoryTimeline(history: any[]): string {
  const actionIcons: Record<string, string> = {
    created: '🎯',
    accepted: '✅',
    declined: '❌',
    'counter-proposed': '🔄',
    'accepted-partial': '👥',
    cancelled: '🚫',
    'time-changed': '⏰',
  };

  return `
    <table style="width:100%; border-collapse:collapse; font-family: system-ui; margin: 20px 0;">
      <tr>
        <td style="padding: 12px 16px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px 8px 0 0;">
          <strong style="color: #111827; font-size: 14px;">📋 History</strong>
        </td>
      </tr>
      ${history.slice(-5).reverse().map((h, idx) => `
      <tr>
        <td style="padding: 12px 16px; background: white; border: 1px solid #e5e7eb; border-top: ${idx === 0 ? 'none' : '1px solid #e5e7eb'};">
          <div style="display: flex; align-items: start; gap: 12px;">
            <span style="font-size: 20px;">${actionIcons[h.action] || '📌'}</span>
            <div style="flex: 1;">
              <div style="color: #111827; font-weight: 600;">
                ${h.byName || h.by} ${h.action.replace('-', ' ')}
              </div>
              <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">
                ${new Date(h.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
              ${h.details?.reason ? `
              <div style="margin-top: 6px; color: #6b7280; font-size: 13px;">
                "${h.details.reason}"
              </div>
              ` : ''}
            </div>
          </div>
        </td>
      </tr>
      `).join('')}
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
  actionUrl?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${params.subject}</title>
    </head>
    <body style="font-family: system-ui; background-color: #f3f4f6; padding: 20px; margin: 0;">
      <table style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding: 24px;">
            <h1 style="margin: 0; font-size: 20px; color: #111827;">Hi ${params.recipientName},</h1>
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
        ${params.actionUrl ? `
        <tr>
          <td style="padding: 0 24px 20px 24px; text-align: center;">
            <a href="${params.actionUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Appointment
            </a>
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">Best regards,</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">ARDA Employee Central Hub</p>
          </td>
        </tr>
      </table>
      <table style="max-width: 600px; margin: 12px auto;">
        <tr>
          <td style="text-align: center; padding: 12px;">
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
              This is an automated notification from ARDA Employee Central Hub.<br/>
              Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Send appointment invitation
 */
export async function sendAppointmentInvitation(
  appointment: any,
  recipientUsername: string
): Promise<void> {
  try {
    const userInfo = await getUserInfo(recipientUsername);
    if (!userInfo?.email) {
      console.log(`⚠️  No email found for user: ${recipientUsername}`);
      return;
    }

    const subject = `📅 Meeting Invitation: ${appointment.title}`;
    const mainMessage = `<p>You've been invited to a meeting by <strong>${appointment.creatorName}</strong>.</p>`;
    const actionRequired = 'Please review the meeting details and respond (Accept/Decline/Propose Changes).';

    const detailsHtml = buildAppointmentDetails(appointment) +
                       buildParticipantsList(appointment.participants) +
                       buildHistoryTimeline(appointment.history);

    const emailHtml = buildEmailTemplate({
      recipientName: userInfo.name,
      subject,
      mainMessage,
      detailsHtml,
      actionRequired,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments/${appointment._id}`
    });

    await sendEmail(
      userInfo.email,
      subject,
      `Meeting invitation: ${appointment.title}`,
      emailHtml
    );

    console.log(`✅ Invitation sent to: ${userInfo.name}`);
  } catch (error) {
    console.error(`❌ Failed to send invitation to ${recipientUsername}`);
  }
}

/**
 * Send appointment confirmation (when meeting is confirmed/locked)
 */
export async function sendAppointmentConfirmation(
  appointment: any,
  recipientUsername: string
): Promise<void> {
  try {
    const userInfo = await getUserInfo(recipientUsername);
    if (!userInfo?.email) return;

    const subject = `✅ Meeting Confirmed: ${appointment.title}`;
    const mainMessage = `<p>The meeting "<strong>${appointment.title}</strong>" has been confirmed and added to your calendar.</p>`;

    const detailsHtml = buildAppointmentDetails(appointment) +
                       buildParticipantsList(appointment.participants) +
                       buildHistoryTimeline(appointment.history);

    const emailHtml = buildEmailTemplate({
      recipientName: userInfo.name,
      subject,
      mainMessage,
      detailsHtml,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments/${appointment._id}`
    });

    await sendEmail(
      userInfo.email,
      subject,
      `Meeting confirmed: ${appointment.title}`,
      emailHtml
    );

    console.log(`✅ Confirmation sent to: ${userInfo.name}`);
  } catch (error) {
    console.error(`❌ Failed to send confirmation to ${recipientUsername}`);
  }
}

/**
 * Send time change notification
 */
export async function sendTimeChangeNotification(
  appointment: any,
  recipientUsername: string,
  changedBy: string,
  changedByName: string
): Promise<void> {
  try {
    const userInfo = await getUserInfo(recipientUsername);
    if (!userInfo?.email) return;

    const subject = `🔄 Meeting Time Changed: ${appointment.title}`;
    const mainMessage = `<p><strong>${changedByName}</strong> has proposed changes to the meeting time. All participants need to respond again.</p>`;
    const actionRequired = 'Please review the new time and respond (Accept/Decline/Propose Different Time).';

    const detailsHtml = buildAppointmentDetails(appointment) +
                       buildParticipantsList(appointment.participants) +
                       buildHistoryTimeline(appointment.history);

    const emailHtml = buildEmailTemplate({
      recipientName: userInfo.name,
      subject,
      mainMessage,
      detailsHtml,
      actionRequired,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments/${appointment._id}`
    });

    await sendEmail(
      userInfo.email,
      subject,
      `Meeting time changed: ${appointment.title}`,
      emailHtml
    );

    console.log(`✅ Time change notification sent to: ${userInfo.name}`);
  } catch (error) {
    console.error(`❌ Failed to send time change notification to ${recipientUsername}`);
  }
}

/**
 * Send cancellation notification
 */
export async function sendCancellationNotification(
  appointment: any,
  recipientUsername: string,
  cancelledBy: string,
  cancelledByName: string,
  reason?: string
): Promise<void> {
  try {
    const userInfo = await getUserInfo(recipientUsername);
    if (!userInfo?.email) return;

    const subject = `🚫 Meeting Cancelled: ${appointment.title}`;
    const mainMessage = `<p>The meeting has been cancelled by <strong>${cancelledByName}</strong>.</p>
                        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}`;

    const detailsHtml = buildAppointmentDetails(appointment) +
                       buildHistoryTimeline(appointment.history);

    const emailHtml = buildEmailTemplate({
      recipientName: userInfo.name,
      subject,
      mainMessage,
      detailsHtml
    });

    await sendEmail(
      userInfo.email,
      subject,
      `Meeting cancelled: ${appointment.title}`,
      emailHtml
    );

    console.log(`✅ Cancellation notification sent to: ${userInfo.name}`);
  } catch (error) {
    console.error(`❌ Failed to send cancellation notification to ${recipientUsername}`);
  }
}

export default {
  sendAppointmentInvitation,
  sendAppointmentConfirmation,
  sendTimeChangeNotification,
  sendCancellationNotification
};