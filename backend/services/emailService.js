/**
 * Email Service for CEMS using Brevo Transactional Email REST API.
 * Uses native fetch (Node 18+) with zero external dependencies.
 * Secrets (API Key) are backend-only and never logged.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'no-reply@cems.edu';
  const fromName = process.env.MAIL_FROM_NAME || 'CEMS - College Event Management System';
  const frontendUrl = (process.env.FRONTEND_URL || 'https://atharva1811.github.io/college-event-management-system').replace(/\/$/, '');

  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  if (!apiKey) {
    console.warn('[EmailService] BREVO_API_KEY is not configured in environment. Skipping Brevo API dispatch.');
    return {
      success: false,
      skipped: true,
      reason: 'BREVO_API_KEY missing in environment',
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

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[EmailService] Brevo API rejected email. HTTP status:', response.status, errData.message || '');
      return { success: false, error: errData.message || `Brevo HTTP ${response.status}` };
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('[EmailService] Network or provider error while dispatching email:', error.message);
    return { success: false, error: error.message };
  }
};
