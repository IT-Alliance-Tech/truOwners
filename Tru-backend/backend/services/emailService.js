const transporter = require('../config/email');

const sendEmail = async (to, subject, text, html, fromName = null) => {
  try {
    const fromOptions = fromName 
      ? {
          name: fromName,
          address: process.env.GMAIL_USER
        }
      : process.env.GMAIL_USER;

    await transporter.sendMail({
      from: fromOptions,
      to,
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Base HTML template for consistent styling
const getBaseTemplate = (content) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${process.env.APP_NAME || 'Rental Platform'}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            ${process.env.APP_NAME || 'Rental Platform'}
          </h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0; line-height: 1.5;">
            This is an automated email from ${process.env.APP_NAME || 'Rental Platform'}. Please do not reply to this email.
          </p>
          <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} ${process.env.APP_NAME || 'Rental Platform'}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// OTP Verification Email
const sendOTPEmail = async (email, otp, purpose = 'account verification') => {
  const subject = `Your OTP for ${process.env.APP_NAME || 'Rental Platform'}`;
  const fromName = `"No Reply - ${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`;
  
  const content = `
    <div style="text-align: center;">
      <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Verification Required</h2>
      <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        We received a request for ${purpose}. Please use the verification code below to continue:
      </p>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 30px 0; display: inline-block; min-width: 200px;">
        ${otp}
      </div>
      
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <p style="color: #856404; font-size: 14px; margin: 0;">
          ⏰ <strong>Important:</strong> This verification code will expire in 10 minutes for security reasons.
        </p>
      </div>
      
      <p style="color: #666; font-size: 14px; line-height: 1.5;">
        If you didn't request this verification, please ignore this email or contact our support team if you have concerns.
      </p>
    </div>
  `;
  
  const html = getBaseTemplate(content);
  const text = `Your OTP for ${purpose} is: ${otp}. This code will expire in 10 minutes.`;
  
  return await sendEmail(email, subject, text, html, fromName);
};

// Welcome Email
const sendWelcomeEmail = async (email, userName, userType = 'user') => {
  const subject = `Welcome to ${process.env.APP_NAME || 'Rental Platform'}!`;
  const fromName = `"No Reply - ${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`;
  
  const content = `
    <div style="text-align: center;">
      <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Welcome Aboard! 🎉</h2>
      <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Hi <strong>${userName}</strong>,<br>
        Thank you for joining ${process.env.APP_NAME || 'our platform'} as a ${userType}. We're excited to have you with us!
      </p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: left;">
        <h3 style="color: #333; margin-top: 0;">What's next?</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li>Complete your profile setup</li>
          <li>Explore available rental properties</li>
          <li>Set up your preferences</li>
          <li>Start your rental journey</li>
        </ul>
      </div>
      
      <p style="color: #666; font-size: 14px; line-height: 1.5;">
        If you have any questions, feel free to contact our support team. We're here to help!
      </p>
    </div>
  `;
  
  const html = getBaseTemplate(content);
  const text = `Welcome to ${process.env.APP_NAME || 'Rental Platform'}, ${userName}! Thank you for joining us as a ${userType}.`;
  
  return await sendEmail(email, subject, text, html, fromName);
};

// Password Reset Email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const subject = `Password Reset Request - ${process.env.APP_NAME || 'Rental Platform'}`;
  const fromName = `"No Reply - ${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`;
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const content = `
    <div style="text-align: center;">
      <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Password Reset Request</h2>
      <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Hi <strong>${userName}</strong>,<br>
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <p style="color: #721c24; font-size: 14px; margin: 0;">
          🔒 <strong>Security Notice:</strong> This reset link will expire in 1 hour.
        </p>
      </div>
      
      <p style="color: #666; font-size: 14px; line-height: 1.5;">
        If you can't click the button, copy and paste this link into your browser:<br>
        <span style="word-break: break-all; color: #007bff;">${resetUrl}</span>
      </p>
      
      <p style="color: #666; font-size: 14px; line-height: 1.5;">
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `;
  
  const html = getBaseTemplate(content);
  const text = `Password reset requested for ${process.env.APP_NAME || 'Rental Platform'}. Visit: ${resetUrl}`;
  
  return await sendEmail(email, subject, text, html, fromName);
};

// Booking Confirmation Email
const sendBookingConfirmationEmail = async (email, userName, bookingDetails) => {
  const subject = `Booking Confirmation - ${process.env.APP_NAME || 'Rental Platform'}`;
  const fromName = `"No Reply - ${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`;
  
  const content = `
    <div>
      <h2 style="color: #333; margin-bottom: 20px; font-size: 24px; text-align: center;">Booking Confirmed! ✅</h2>
      <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Hi <strong>${userName}</strong>,<br>
        Your booking has been confirmed. Here are the details:
      </p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Booking ID:</td>
            <td style="padding: 8px 0; color: #333;">${bookingDetails.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Property:</td>
            <td style="padding: 8px 0; color: #333;">${bookingDetails.propertyName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Check-in:</td>
            <td style="padding: 8px 0; color: #333;">${bookingDetails.checkIn}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Check-out:</td>
            <td style="padding: 8px 0; color: #333;">${bookingDetails.checkOut}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Total Amount:</td>
            <td style="padding: 8px 0; color: #28a745; font-weight: bold;">${bookingDetails.totalAmount}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #666; font-size: 14px; line-height: 1.5; text-align: center;">
        We'll send you additional details closer to your check-in date. Have a great stay!
      </p>
    </div>
  `;
  
  const html = getBaseTemplate(content);
  const text = `Booking confirmed for ${bookingDetails.propertyName}. Booking ID: ${bookingDetails.id}`;
  
  return await sendEmail(email, subject, text, html, fromName);
};


module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail
};
