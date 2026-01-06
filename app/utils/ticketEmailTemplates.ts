// utils/ticketEmailTemplates.ts

interface EmailTemplateParams {
  recipientName: string;
  subject: string;
  greeting: string;
  mainMessage: string;
  detailsTable: string;
  actionRequired?: string;
  closingMessage?: string;
}

/**
 * Builds a formatted HTML table for ticket details
 * @param ticket - The ticket object
 * @param functionality - Optional functionality object for field labels
 * @returns HTML string for ticket details
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
          // Try to parse if it's a stringified JSON
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          
          // If it's a table-like object with columns
          if (Array.isArray(parsed)) {
            const headers = Object.keys(parsed[0] || {});
            
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
                  ${parsed.map((row: any) => `
                    <tr>
                      ${headers.map(h => `<td style="padding: 4px 8px; border: 1px solid #e5e7eb;">${row[h] || ''}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `;
          } else {
            // Regular object - show as key: value pairs
            formattedValue = Object.entries(parsed)
              .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
              .join('<br/>');
          }
        } catch (e) {
          formattedValue = JSON.stringify(value);
        }
      } else {
        // Simple string or number
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

  // Format workflow history (last 5 entries)
  const historyRows = (ticket.workflowHistory || [])
    .slice(-5)
    .reverse()
    .map((entry: any, index: number) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">${new Date(entry.performedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 12px;"><strong>${entry.actionType}</strong></td>
        <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 12px;">${entry.performedBy?.name || 'System'}</td>
      </tr>
    `)
    .join('');

  // Get priority color
  const priorityColors: Record<string, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };
  const priorityColor = priorityColors[ticket.priority] || '#6b7280';

  const detailsTable = `
    <table style="width:100%; border-collapse:collapse; font-family: system-ui, -apple-system, sans-serif; font-size:14px; color:#111827; margin: 20px 0;">
      
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
              <td style="padding: 8px 0; width: 50%;">
                <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Priority</span><br/>
                <span style="color: ${priorityColor}; font-weight: 600; font-size: 14px;">${ticket.priority.toUpperCase()}</span>
              </td>
              <td style="padding: 8px 0; width: 50%;">
                <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Department</span><br/>
                <span style="color: #111827; font-weight: 600; font-size: 14px;">${ticket.department}</span>
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

      ${historyRows ? `
      <!-- Workflow History -->
      <tr>
        <td style="padding: 16px 16px 8px 16px;">
          <h3 style="margin: 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">History</h3>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 16px 16px 16px;">
          <table style="width:100%; border-collapse:collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600;">DATE</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600;">ACTION</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600;">BY</th>
              </tr>
            </thead>
            <tbody>
              ${historyRows}
            </tbody>
          </table>
        </td>
      </tr>
      ` : ''}

    </table>
  `;

  return detailsTable;
};

/**
 * Generic email template builder
 * @param params - Email template parameters
 * @returns Complete HTML email template
 */
export const buildEmailTemplate = ({
  recipientName,
  subject,
  greeting,
  mainMessage,
  detailsTable,
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
      
      <table style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        
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
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">ARDA</p>
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