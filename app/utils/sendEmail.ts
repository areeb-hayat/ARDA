// utils/sendEmail.ts
import nodemailer from 'nodemailer';

// Create transporter with your SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '203.82.55.246',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL || 'arda@pepsiisb.com',
    pass: process.env.EMAIL_PASSWORD || '123456',
  },
  debug: false, // Disable debugging
  logger: false, // Disable SMTP logging
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false
  }
});

interface AttachmentOptions {
  filename: string;
  path?: string;
  content?: string | Buffer;
}

/**
 * Send email function
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param text - Plain text version of email
 * @param html - HTML version of email
 * @param attachments - Optional array of attachment objects
 * @returns Promise - Resolves with info about sent email
 */
const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string,
  attachments: AttachmentOptions[] = []
): Promise<any> => {
  try {
    // Validate inputs
    if (!to || !subject) {
      throw new Error('Recipient email and subject are required');
    }

    // Prepare mail options
    const mailOptions = {
      from: `"ARDA" <${process.env.EMAIL || 'arda@pepsiisb.com'}>`,
      to,
      subject,
      text: text || 'This email requires HTML support to display properly.',
      html: html || text,
      attachments: attachments || [],
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    // Minimal logging
    console.log(`✅ Email: ${to}`);

    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

/**
 * Verify SMTP connection
 * @returns Promise<boolean>
 */
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ SMTP server is ready to send emails');
    return true;
  } catch (error) {
    console.error('❌ SMTP server connection failed:', error);
    return false;
  }
};

export default sendEmail;