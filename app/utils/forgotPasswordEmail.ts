// app/utils/forgotPasswordEmail.ts
import sendEmail from './sendEmail';
import FormData from '@/models/FormData';
import bcrypt from 'bcryptjs';

/**
 * Generate a random password
 */
function generatePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Build forgot password email template
 */
function buildForgotPasswordEmailTemplate(params: {
  recipientName: string;
  username: string;
  newPassword: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset - ARDA</title>
    </head>
    <body style="font-family: system-ui; background-color: #f3f4f6; padding: 20px; margin: 0;">
      <table style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <tr>
          <td style="padding: 0;">
            <div style="background: linear-gradient(135deg, #0000FF 0%, #6495ED 100%); padding: 32px 24px; text-align: center;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.1); padding: 12px 24px; border-radius: 8px; border: 2px solid rgba(255, 255, 255, 0.2);">
                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 900; letter-spacing: 2px;">ARDA</h1>
              </div>
              <p style="margin: 16px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 500;">Password Reset Request</p>
            </div>
          </td>
        </tr>
        
        <!-- Greeting -->
        <tr>
          <td style="padding: 32px 24px 16px 24px;">
            <h2 style="margin: 0; font-size: 20px; color: #111827;">Hi ${params.recipientName},</h2>
          </td>
        </tr>
        
        <!-- Message -->
        <tr>
          <td style="padding: 0 24px 24px 24px;">
            <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 15px;">
              Your password has been successfully reset. Below are your new login credentials:
            </p>
          </td>
        </tr>
        
        <!-- Credentials Box -->
        <tr>
          <td style="padding: 0 24px 24px 24px;">
            <table style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 8px; overflow: hidden; border: 2px solid #e5e7eb;">
              <tr>
                <td style="padding: 20px;">
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                        <span style="display: block; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Username</span>
                        <span style="display: block; color: #111827; font-size: 16px; font-weight: 600; font-family: monospace;">${params.username}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <span style="display: block; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">New Password</span>
                        <span style="display: block; color: #0000FF; font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 1px;">${params.newPassword}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Security Warning -->
        <tr>
          <td style="padding: 0 24px 24px 24px;">
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px;">
              <div style="display: flex; align-items: start;">
                <span style="font-size: 20px; margin-right: 12px;">🔒</span>
                <div>
                  <strong style="color: #92400e; font-size: 14px; display: block; margin-bottom: 4px;">Security Recommendation</strong>
                  <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
                    For security reasons, please change this password after your first login. Go to your profile settings to update your password.
                  </p>
                </div>
              </div>
            </div>
          </td>
        </tr>
        
        <!-- Login Button -->
        <tr>
          <td style="padding: 0 24px 32px 24px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" 
               style="display: inline-block; background: linear-gradient(135deg, #0000FF 0%, #6495ED 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(0, 0, 255, 0.3); transition: all 0.3s;">
              LOGIN TO ARDA →
            </a>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="padding: 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Best regards,</p>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280;">ARDA Team</p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
              If you didn't request this password reset, please contact your system administrator immediately.
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Footer Note -->
      <table style="max-width: 600px; margin: 16px auto;">
        <tr>
          <td style="text-align: center; padding: 0 24px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
              This is an automated message from ARDA Employee Central Hub. Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Send forgot password email
 */
export async function sendForgotPasswordEmail(
  username: string,
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Find user by username and email
    const user = await FormData.findOne({
      username: username.trim(),
      'contactInformation.email': email.trim().toLowerCase()
    }).select('basicDetails.name username password');

    if (!user) {
      return {
        success: false,
        message: 'No account found with this username and email combination.'
      };
    }

    // Generate new password
    const newPassword = generatePassword(12);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    user.password = hashedPassword;
    await user.save();

    // Prepare email content
    const recipientName = user.basicDetails?.name || username;
    const subject = 'Password Reset - ARDA Employee Central Hub';
    const emailHtml = buildForgotPasswordEmailTemplate({
      recipientName,
      username,
      newPassword
    });

    // Send email
    await sendEmail(
      email,
      subject,
      `Your password has been reset. New password: ${newPassword}`,
      emailHtml
    );

    console.log(`✅ Password reset email sent to: ${email}`);

    return {
      success: true,
      message: 'Password reset successful. Check your email for the new password.'
    };
  } catch (error) {
    console.error('❌ Failed to send forgot password email:', error);
    return {
      success: false,
      message: 'An error occurred while resetting your password. Please try again.'
    };
  }
}

export default sendForgotPasswordEmail;