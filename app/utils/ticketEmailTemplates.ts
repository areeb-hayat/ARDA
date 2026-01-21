// utils/ticketEmailTemplates.ts

interface EmailTemplateParams {
  recipientName: string;
  subject: string;
  greeting: string;
  mainMessage: string;
  detailsTable: string;
  workflowHistoryTable?: string;
  actionRequired?: string;
  closingMessage?: string;
}

/**
 * Builds workflow history table for email
 */
export const buildWorkflowHistoryTable = (workflowHistory: any[] = []): string => {
  if (!workflowHistory || workflowHistory.length === 0) {
    return '';
  }

  const historyRows = workflowHistory
    .slice().reverse() // Most recent first
    .slice(0, 10) // Limit to 10 most recent entries
    .map((entry: any) => {
      const actionIcon: Record<string, string> = {
        'forwarded': '➡️',
        'reverted': '⏪',
        'reassigned': '🔄',
        'group_formed': '👥',
        'in_progress': '📝',
        'resolved': '✅',
        'blocked': '🚫',
        'blocker_reported': '⚠️',
        'blocker_resolved': '✓',
        'closed': '🔒',
        'reopened': '🔓',
      };

      const icon = actionIcon[entry.actionType] || '•';
      const date = new Date(entry.performedAt).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let actionText = entry.actionType.replace(/_/g, ' ').toUpperCase();
      let details = '';

      // Add explanation if available
      if (entry.explanation) {
        details = `<br/><span style="color: #6b7280; font-size: 11px;">"${entry.explanation}"</span>`;
      }

      // Add revert message
      if (entry.actionType === 'reverted' && entry.explanation) {
        details = `<br/><span style="color: #92400e; font-size: 11px; font-style: italic;">"${entry.explanation}"</span>`;
      }

      // Add attachments indicator
      if (entry.attachments && entry.attachments.length > 0) {
        details += `<br/><span style="color: #6366f1; font-size: 11px;">📎 ${entry.attachments.length} attachment(s)</span>`;
      }

      // Add group members if applicable
      if (entry.groupMembers && entry.groupMembers.length > 0) {
        const memberNames = entry.groupMembers.map((m: any) => 
          m.isLead ? `<strong>${m.name}</strong> (Lead)` : m.name
        ).join(', ');
        details += `<br/><span style="color: #6b7280; font-size: 11px;">Group: ${memberNames}</span>`;
      }

      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; white-space: nowrap;">${date}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
            <strong>${icon} ${actionText}</strong>${details}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #374151;">${entry.performedBy?.name || 'System'}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="margin: 20px 0;">
      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📜 Workflow History</h3>
      <table style="width:100%; border-collapse:collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 10px 12px; border-bottom: 2px solid #e5e7eb; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">DATE/TIME</th>
            <th style="padding: 10px 12px; border-bottom: 2px solid #e5e7eb; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">ACTION</th>
            <th style="padding: 10px 12px; border-bottom: 2px solid #e5e7eb; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">PERFORMED BY</th>
          </tr>
        </thead>
        <tbody>
          ${historyRows}
        </tbody>
      </table>
    </div>
  `;
};

/**
 * Builds a formatted HTML table for ticket details
 */
export const buildTicketDetailsTable = (ticket: any, functionality: any = null): string => {
  // Create field label map from functionality
  const fieldLabels: Record<string, string> = {};
  if (functionality?.formSchema?.fields) {
    functionality.formSchema.fields.forEach((field: any) => {
      fieldLabels[field.id] = field.label;
    });
  }

  // Format form data dynamically (exclude attachments)
  const formDataRows = Object.entries(ticket.formData || {})
    .filter(([key]) => !key.toLowerCase().includes('attachment'))
    .map(([key, value]) => {
      // Get label from functionality or format the key
      let formattedKey = fieldLabels[key] || key
        .replace('default-', '')
        .replace(/field-/i, 'Field ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      // Handle different value types
      let formattedValue = '';
      
      if (Array.isArray(value)) {
        // Handle arrays (like table data)
        try {
          // If it's an array of objects (table rows), format as HTML table
          if (value.length > 0 && typeof value[0] === 'object') {
            const headers = Object.keys(value[0]);
            
            // Get column labels from functionality if available
            let columnLabels: Record<string, string> = {};
            if (functionality?.formSchema?.fields) {
              const tableField = functionality.formSchema.fields.find((f: any) => f.id === key);
              if (tableField?.tableConfig?.columns) {
                tableField.tableConfig.columns.forEach((col: any) => {
                  columnLabels[col.id] = col.label;
                });
              }
            }
            
            formattedValue = `
              <table style="width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 12px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    ${headers.map(h => `<th style="padding: 4px 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">${columnLabels[h] || h}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${value.map(row => `
                    <tr>
                      ${headers.map(h => `<td style="padding: 4px 8px; border: 1px solid #e5e7eb;">${row[h] || ''}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `;
          } else {
            // Simple array
            formattedValue = value.join(', ');
          }
        } catch (e) {
          formattedValue = JSON.stringify(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle objects
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          
          if (Array.isArray(parsed)) {
            const headers = Object.keys(parsed[0] || {});
            
            let columnLabels: Record<string, string> = {};
            if (functionality?.formSchema?.fields) {
              const tableField = functionality.formSchema.fields.find((f: any) => f.id === key);
              if (tableField?.tableConfig?.columns) {
                tableField.tableConfig.columns.forEach((col: any) => {
                  columnLabels[col.id] = col.label;
                });
              }
            }
            
            formattedValue = `
              <table style="width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 12px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    ${headers.map(h => `<th style="padding: 4px 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">${columnLabels[h] || h}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${parsed.map((row: any) => `
                    <tr>
                      ${headers.map(h => `<td style="padding: 4px 8px; border: 1px solid #e5e7eb;">${row[h] || ''}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `;
          } else {
            formattedValue = Object.entries(parsed)
              .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
              .join('<br/>');
          }
        } catch (e) {
          formattedValue = JSON.stringify(value);
        }
      } else {
        formattedValue = String(value);
      }
      
      return `
      <tr>
        <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600; width: 30%; background: #f9fafb; vertical-align: top;">${formattedKey}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb; vertical-align: top;">${formattedValue}</td>
      </tr>
    `;
    })
    .join('');

  // Get priority color
  const priorityColors: Record<string, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };
  const priorityColor = priorityColors[ticket.priority] || '#6b7280';

  // Count attachments
  let attachmentCount = 0;
  Object.entries(ticket.formData || {}).forEach(([key, value]) => {
    if (key.toLowerCase().includes('attachment') && value) {
      if (Array.isArray(value)) {
        attachmentCount += value.length;
      } else {
        attachmentCount += 1;
      }
    }
  });
  
  // Count workflow history attachments
  (ticket.workflowHistory || []).forEach((entry: any) => {
    if (entry.attachments && Array.isArray(entry.attachments)) {
      attachmentCount += entry.attachments.length;
    }
  });

  const detailsTable = `
    <table style="width:100%; border-collapse:collapse; font-family: system-ui, -apple-system, sans-serif; font-size:14px; color:#111827;">
      
      <!-- Ticket Summary Card -->
      <tr>
        <td style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">Ticket ${ticket.ticketNumber}</h2>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${ticket.functionalityName}</p>
        </td>
      </tr>

      <!-- Quick Info -->
      <tr>
        <td style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; width: 33%;">
                <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Priority</span><br/>
                <span style="color: ${priorityColor}; font-weight: 600; font-size: 14px;">${ticket.priority.toUpperCase()}</span>
              </td>
              <td style="padding: 8px 0; width: 33%;">
                <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Department</span><br/>
                <span style="color: #111827; font-weight: 600; font-size: 14px;">${ticket.department}</span>
              </td>
              <td style="padding: 8px 0; width: 33%; text-align: right;">
                <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Attachments</span><br/>
                <span style="color: #6366f1; font-weight: 600; font-size: 14px;">📎 ${attachmentCount}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${formDataRows ? `
      <!-- Form Details -->
      <tr>
        <td style="padding: 16px 16px 8px 16px;">
          <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Details</h3>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 16px 16px 16px;">
          <table style="width:100%; border-collapse:collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
            ${formDataRows}
          </table>
        </td>
      </tr>
      ` : ''}

      <!-- Raised By -->
      <tr>
        <td style="padding: 12px 16px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0;">
                <span style="color: #6b7280; font-size: 12px;">Created by</span><br/>
                <span style="color: #111827; font-weight: 500;">${ticket.raisedBy?.name || 'Unknown'}</span>
                ${ticket.raisedBy?.email ? `<span style="color: #6b7280; font-size: 12px;"> • ${ticket.raisedBy.email}</span>` : ''}
              </td>
              <td style="padding: 4px 0; text-align: right;">
                <span style="color: #6b7280; font-size: 12px;">${new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  `;

  return detailsTable;
};

/**
 * Generic email template builder
 */
export const buildEmailTemplate = ({
  recipientName,
  subject,
  greeting,
  mainMessage,
  detailsTable,
  workflowHistoryTable = '',
  actionRequired = '',
  closingMessage = '',
}: EmailTemplateParams): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background-color: #f3f4f6;">
      
      <table style="max-width: 650px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <tr>
          <td style="padding: 24px 24px 16px 24px;">
            <h1 style="margin: 0; color: #111827; font-size: 20px; font-weight: 600;">Hi ${recipientName},</h1>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="padding: 0 24px 20px 24px; color: #374151; font-size: 15px; line-height: 1.6;">
            ${mainMessage}
          </td>
        </tr>

        ${actionRequired ? `
        <!-- Action Required -->
        <tr>
          <td style="padding: 0 24px 20px 24px;">
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px;">
              <strong style="color: #92400e; font-size: 14px;">⚡ Action Required</strong>
              <p style="margin: 4px 0 0 0; color: #78350f; font-size: 13px;">${actionRequired}</p>
            </div>
          </td>
        </tr>
        ` : ''}

        <!-- Details -->
        <tr>
          <td style="padding: 0 24px;">
            ${detailsTable}
          </td>
        </tr>

        ${workflowHistoryTable ? `
        <!-- Workflow History -->
        <tr>
          <td style="padding: 0 24px 20px 24px;">
            ${workflowHistoryTable}
          </td>
        </tr>
        ` : ''}

        ${closingMessage ? `
        <!-- Closing -->
        <tr>
          <td style="padding: 20px 24px; color: #6b7280; font-size: 13px;">
            ${closingMessage}
          </td>
        </tr>
        ` : ''}

        <!-- Footer -->
        <tr>
          <td style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 500;">Best regards,</p>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">ARDA Ticketing System</p>
          </td>
        </tr>

        <!-- Disclaimer -->
        <tr>
          <td style="padding: 16px 24px; background: #f9fafb; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.4;">
              This is an automated notification from ARDA.<br/>
              Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>

    </body>
    </html>
  `;
};