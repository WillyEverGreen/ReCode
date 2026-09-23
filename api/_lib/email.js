import nodemailer from 'nodemailer';

// Email transporter - uses Gmail or other SMTP
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const resendApiKey = process.env.RESEND_API_KEY; // Auto-detect Resend
  console.log('[EMAIL CONFIG] FROM:', process.env.EMAIL_FROM); // DEBUG: Verify env var

  // Detect placeholder/dummy credentials — skip real SMTP to avoid auth errors
  const placeholders = [
    'your-email@gmail.com',
    'your-app-password',
    'your-email',
    'your-password',
    'placeholder',
  ];
  if (
    !resendApiKey &&
    emailUser &&
    placeholders.some((p) => emailUser.toLowerCase().includes(p))
  ) {
    console.log(
      '[EMAIL] ⚠️  Placeholder SMTP credentials detected — skipping real SMTP. OTP will be logged to console.'
    );
    return null;
  }

  // 1. Resend (Highest Priority)
  if (resendApiKey) {
    console.log('[EMAIL] Initializing Resend SMTP...');
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false, // StartTLS
      auth: {
        user: 'resend',
        pass: resendApiKey,
      },
    });
    console.log('[EMAIL] Resend Transporter Ready.');
    return transporter;
  }

  // 2. Custom SMTP
  if (emailHost) {
    console.log('[EMAIL] Using Custom SMTP:', emailHost);
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: Number(emailPort) || 587,
      secure: (Number(emailPort) || 465) === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    return transporter;
  }

  // 3. Gmail Fallback
  if (emailUser && emailPass) {
    console.log('[EMAIL] Using Gmail Fallback.');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    return transporter;
  }

  console.log(
    '[EMAIL] NO EMAIL PROVIDER CONFIGURED. Checks: RESEND (' +
      (resendApiKey ? 'Yes' : 'No') +
      '), SMTP Host (' +
      (emailHost ? 'Yes' : 'No') +
      '), Gmail User (' +
      (emailUser ? 'Yes' : 'No') +
      ')'
  );
  return null;
}

// Helper to format OTP into individual sleek digit cells
function getDigitCells(otp) {
  const digits = String(otp).trim().split('');
  const cells = digits
    .map(
      (d) => `
    <td style="padding: 0 4px;" align="center">
      <div style="background-color: #0d1527; border: 1.5px solid #ca8a04; border-radius: 10px; width: 44px; height: 52px; line-height: 52px; text-align: center; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, Monaco, monospace; font-size: 26px; font-weight: 700; color: #facc15; box-shadow: 0 4px 12px rgba(0,0,0,0.35);">
        ${d}
      </div>
    </td>
  `
    )
    .join('');

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 24px auto;">
      <tr>
        ${cells}
      </tr>
    </table>
  `;
}

// Branded email template with official logo
function getEmailTemplate(content, title = 'ReCode') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #080c14; min-height: 100vh; padding: 36px 12px;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; margin: 0 auto;">
          
          <!-- Header with Official Logo -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <a href="https://recode.sbs" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://cdn.jsdelivr.net/gh/WillyEverGreen/ReCode@main/public/logo.png" 
                     alt="ReCode" 
                     width="175" 
                     style="display: block; width: 175px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0 auto;" />
              </a>
              <p style="margin: 10px 0 0 0; color: #64748b; font-size: 13px; font-weight: 500; letter-spacing: 0.4px;">
                Master DSA, One Problem at a Time
              </p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0d1322; border: 1px solid #1e293b; border-radius: 16px; padding: 36px 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <tr>
                  <td>
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 28px; color: #475569; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0;">
                © ${new Date().getFullYear()} ReCode Platform · <a href="https://recode.sbs" style="color: #eab308; text-decoration: none; font-weight: 500;">recode.sbs</a>
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #334155;">
                Automated security transmission. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Send verification OTP email
export async function sendVerificationEmail(to, otp) {
  const transport = getTransporter();
  if (!transport) {
    console.log('[EMAIL] Transporter not configured, OTP:', otp);
    return false;
  }

  const content = `
    <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.3px;">
      Verify Your Email
    </h2>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
      Welcome to ReCode! Enter the one-time verification code below to activate your account.
    </p>

    ${getDigitCells(otp)}

    <div style="margin: 28px 0 0 0; padding: 12px 18px; background-color: #090e1a; border: 1px solid #1e293b; border-radius: 10px; text-align: center;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; display: inline-table; vertical-align: middle;">
        <tr>
          <td style="vertical-align: middle; padding-right: 8px;">
            <img src="https://img.icons8.com/material-rounded/48/facc15/clock.png" 
                 alt="Clock" 
                 width="16" 
                 height="16" 
                 style="display: block; width: 16px; height: 16px; border: 0;" />
          </td>
          <td style="vertical-align: middle; color: #94a3b8; font-size: 13px; font-weight: 500;">
            This code expires in <strong style="color: #fbbf24;">2 minutes</strong>.
          </td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center; margin: 20px 0 0 0;">
      If you didn't create an account with ReCode, you can safely ignore this email.
    </p>
  `;

  try {
    await transport.sendMail({
      from:
        process.env.EMAIL_FROM && process.env.EMAIL_FROM.includes('<')
          ? process.env.EMAIL_FROM
          : `"ReCode" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify Your Email - ReCode',
      html: getEmailTemplate(content, 'Verify Email'),
    });
    console.log('[EMAIL] Verification email sent to:', to);
    return true;
  } catch (error) {
    console.error('[EMAIL] Send error:', error.message);
    return false;
  }
}

// Send password reset OTP email
export async function sendPasswordResetEmail(to, otp) {
  const transport = getTransporter();
  if (!transport) {
    console.log('[EMAIL] Transporter not configured, OTP:', otp);
    return false;
  }

  const content = `
    <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.3px;">
      Reset Your Password
    </h2>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
      We received a request to reset your ReCode password. Use the security code below to proceed.
    </p>

    ${getDigitCells(otp)}

    <div style="margin: 28px 0 0 0; padding: 12px 18px; background-color: #090e1a; border: 1px solid #1e293b; border-radius: 10px; text-align: center;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; display: inline-table; vertical-align: middle;">
        <tr>
          <td style="vertical-align: middle; padding-right: 8px;">
            <img src="https://img.icons8.com/material-rounded/48/facc15/clock.png" 
                 alt="Clock" 
                 width="16" 
                 height="16" 
                 style="display: block; width: 16px; height: 16px; border: 0;" />
          </td>
          <td style="vertical-align: middle; color: #94a3b8; font-size: 13px; font-weight: 500;">
            This code expires in <strong style="color: #fbbf24;">2 minutes</strong>.
          </td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center; margin: 20px 0 0 0;">
      If you didn't request a password reset, your account is secure and you can safely ignore this message.
    </p>
  `;

  try {
    await transport.sendMail({
      from:
        process.env.EMAIL_FROM && process.env.EMAIL_FROM.includes('<')
          ? process.env.EMAIL_FROM
          : `"ReCode" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: 'Password Reset - ReCode',
      html: getEmailTemplate(content, 'Password Reset'),
    });
    console.log('[EMAIL] Password reset email sent to:', to);
    return true;
  } catch (error) {
    console.error('[EMAIL] Send error:', error.message);
    return false;
  }
}
