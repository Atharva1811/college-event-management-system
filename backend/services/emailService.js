/**
 * Email Service for CEMS using Brevo Transactional Email REST API.
 * Uses native fetch (Node 18+) with zero external dependencies.
 * Secrets (API Key) are backend-only and never logged.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export const getEmailConfigStatus = () => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const mailFromEmail = (process.env.MAIL_FROM_EMAIL || '').trim();
  const mailFromName = (process.env.MAIL_FROM_NAME || '').trim();
  const frontendUrl = (process.env.FRONTEND_URL || '').trim();

  return {
    isConfigured: Boolean(apiKey),
    hasSenderEmail: Boolean(mailFromEmail),
    hasFrontendUrl: Boolean(frontendUrl),
    senderEmail: mailFromEmail || null,
    senderName: mailFromName || 'CEMS - College Event Management System',
    frontendUrl: frontendUrl || 'https://atharva1811.github.io/college-event-management-system',
  };
};

export const validateEmailEnv = () => {
  const config = getEmailConfigStatus();
  console.log('\n📧 [Email Service] Startup Brevo Environment Check:');
  if (!config.isConfigured) {
    console.warn('⚠️  [Email Service] BREVO_API_KEY is not configured in environment variables.');
  } else {
    console.log('✅ [Email Service] BREVO_API_KEY is configured.');
  }

  if (!config.hasSenderEmail) {
    console.warn('⚠️  [Email Service] MAIL_FROM_EMAIL is not configured in environment. Using fallback sender.');
  } else {
    console.log(`✅ [Email Service] MAIL_FROM_EMAIL is configured: ${config.senderEmail}`);
  }

  if (!config.hasFrontendUrl) {
    console.warn('⚠️  [Email Service] FRONTEND_URL is not configured in environment. Using fallback GitHub Pages base.');
  } else {
    console.log(`✅ [Email Service] FRONTEND_URL is configured: ${config.frontendUrl}`);
  }
  console.log('');
};

export const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const fromEmail = (process.env.MAIL_FROM_EMAIL || '').trim() || 'no-reply@cems.edu';
  const fromName = (process.env.MAIL_FROM_NAME || '').trim() || 'CEMS - College Event Management System';
  const rawFrontendUrl = (process.env.FRONTEND_URL || '').trim() || 'https://atharva1811.github.io/college-event-management-system';
  const frontendUrl = rawFrontendUrl.replace(/\/$/, '');

  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  if (!apiKey) {
    console.error('[BREVO] Dispatch skipped: BREVO_API_KEY is not configured in server environment.');
    return {
      success: false,
      code: 'BREVO_NOT_CONFIGURED',
      error: 'BREVO_API_KEY is not configured in server environment.',
      resetUrl,
    };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your CEMS Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 40px; text-align: center; }
    .logo { display: inline-flex; width: 48px; height: 48px; line-height: 48px; text-align: center; border-radius: 12px; background: #465fff; color: #ffffff; font-size: 24px; font-weight: 900; margin-bottom: 12px; }
    .title { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .body { padding: 40px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #465fff; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 12px rgba(70, 95, 255, 0.35); }
    .expiry { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; text-align: center; }
    .footer { padding: 24px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">C</div>
      <h1 class="title">College Event Management System</h1>
    </div>
    <div class="body">
      <div class="greeting">Hello ${name ? name : 'there'},</div>
      <p class="message">
        We received a request to reset the password for your CEMS account. Click the button below to choose a new password.
      </p>
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
      </div>
      <div class="expiry">
        ⏱️ This password reset link will expire in <strong>30 minutes</strong>.
      </div>
      <p class="message" style="font-size: 13px; color: #64748b; margin-bottom: 0;">
        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} College Event Management System (CEMS). All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const textContent = `Hello ${name ? name : 'there'},

We received a request to reset your password for your College Event Management System (CEMS) account.

Please visit the link below to set a new password:
${resetUrl}

This link will expire in 30 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
College Event Management System (CEMS)
`;

  try {
    console.log('[FORGOT PASSWORD] Sending email through Brevo');
    console.log('[BREVO] Request sent');
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: [
          {
            email: to,
            name: name || to,
          },
        ],
        subject: 'Reset Your CEMS Password',
        htmlContent,
        textContent,
      }),
    });

    console.log(`[BREVO] Response status: ${response.status}`);
    console.log(`[BREVO] HTTP status: ${response.status}`);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const safeErrorMsg = errData.message || errData.code || `HTTP ${response.status}`;
      console.error(`[BREVO] Error: ${safeErrorMsg}`);
      if (response.status === 400 && String(safeErrorMsg).toLowerCase().includes('sender')) {
        console.error(`[BREVO] Sender Configuration Notice: Ensure MAIL_FROM_EMAIL (${fromEmail}) is registered and verified in your Brevo account dashboard.`);
      }
      return {
        success: false,
        code: 'EMAIL_SEND_FAILED',
        error: safeErrorMsg,
      };
    }

    const data = await response.json().catch(() => ({}));
    console.log('[BREVO] Email accepted by Brevo! MessageId:', data.messageId || 'accepted');
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error('[BREVO] Network or communication error:', error.message);
    return {
      success: false,
      code: 'EMAIL_SEND_FAILED',
      error: error.message,
    };
  }
};

export const sendAdminApplicationApprovedEmail = async ({ to, name }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'no-reply@cems.edu';
  const fromName = process.env.MAIL_FROM_NAME || 'CEMS - College Event Management System';
  const frontendUrl = (process.env.FRONTEND_URL || 'https://atharva1811.github.io/college-event-management-system').replace(/\/$/, '');
  const loginUrl = `${frontendUrl}/signin`;

  if (!apiKey) {
    return { success: false, skipped: true, reason: 'BREVO_API_KEY missing' };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Application Approved - CEMS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 40px; text-align: center; }
    .logo { display: inline-flex; width: 48px; height: 48px; line-height: 48px; text-align: center; border-radius: 12px; background: #465fff; color: #ffffff; font-size: 24px; font-weight: 900; margin-bottom: 12px; }
    .title { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
    .body { padding: 40px; }
    .btn { display: inline-block; background-color: #465fff; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; }
    .footer { padding: 20px 40px; background: #f8fafc; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">C</div>
      <h1 class="title">Admin Privileges Granted</h1>
    </div>
    <div class="body">
      <h3>Hello ${name || 'Administrator'},</h3>
      <p style="color: #475569; line-height: 1.6;">
        Congratulations! Your application for <strong>Administrator Access</strong> in the College Event Management System (CEMS) has been approved by the system administration.
      </p>
      <p style="color: #475569; line-height: 1.6;">
        You can now sign in with your credentials to access the Admin Governance Dashboard, approve applications, manage campus venues, and view database insights.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" class="btn" target="_blank" rel="noopener noreferrer">Sign In to Admin Dashboard</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} College Event Management System (CEMS).
    </div>
  </div>
</body>
</html>`;

  const textContent = `Hello ${name || 'Administrator'},\n\nCongratulations! Your application for Administrator Access in CEMS has been approved.\n\nYou can now log in at: ${loginUrl}\n\nRegards,\nCollege Event Management System`;

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to, name: name || to }],
        subject: 'Admin Access Granted - CEMS',
        htmlContent,
        textContent,
      }),
    });
    return { success: response.ok };
  } catch (error) {
    console.error('[EmailService] Failed to send admin approval email:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendAdminApplicationDeniedEmail = async ({ to, name, reason }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'no-reply@cems.edu';
  const fromName = process.env.MAIL_FROM_NAME || 'CEMS - College Event Management System';

  if (!apiKey) {
    return { success: false, skipped: true, reason: 'BREVO_API_KEY missing' };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Application Status Update - CEMS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 24px 40px; text-align: center; }
    .title { color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; }
    .body { padding: 40px; }
    .reason-box { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 14px 18px; border-radius: 10px; margin: 20px 0; font-size: 13px; }
    .footer { padding: 20px 40px; background: #f8fafc; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Administrator Application Update</h1>
    </div>
    <div class="body">
      <h3>Hello ${name || 'there'},</h3>
      <p style="color: #475569; line-height: 1.6;">
        Thank you for your interest in contributing to the College Event Management System.
      </p>
      <p style="color: #475569; line-height: 1.6;">
        Your application for administrator privileges was reviewed by the current system administration and could not be approved at this time.
      </p>
      ${reason ? `<div class="reason-box"><strong>Reason:</strong> ${reason}</div>` : ''}
      <p style="color: #64748b; font-size: 13px; margin-top: 20px;">
        If you have questions regarding this decision, please reach out to your department faculty coordinator.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} College Event Management System (CEMS).
    </div>
  </div>
</body>
</html>`;

  const textContent = `Hello ${name || 'there'},\n\nYour application for administrator privileges in CEMS was reviewed and could not be approved at this time.${reason ? `\n\nReason: ${reason}` : ''}\n\nRegards,\nCollege Event Management System`;

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to, name: name || to }],
        subject: 'Admin Application Update - CEMS',
        htmlContent,
        textContent,
      }),
    });
    return { success: response.ok };
  } catch (error) {
    console.error('[EmailService] Failed to send admin denial email:', error.message);
    return { success: false, error: error.message };
  }
};
