import nodemailer from "nodemailer";

// Email transporter - uses Gmail or other SMTP
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const resendApiKey = process.env.RESEND_API_KEY; // Auto-detect Resend
  console.log("[EMAIL CONFIG] FROM:", process.env.EMAIL_FROM); // DEBUG: Verify env var
  
  // 1. Resend (Highest Priority)
  if (resendApiKey) {
    console.log("[EMAIL] Initializing Resend SMTP...");
    transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 587,
      secure: false, // StartTLS
      auth: {
        user: "resend",
        pass: resendApiKey,
      },
    });
    console.log("[EMAIL] Resend Transporter Ready.");
    return transporter;
  }

  // 2. Custom SMTP
  if (emailHost) {
    console.log("[EMAIL] Using Custom SMTP:", emailHost);
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
    console.log("[EMAIL] Using Gmail Fallback.");
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    return transporter;
  }
  
  console.log("[EMAIL] NO EMAIL PROVIDER CONFIGURED. Checks: RESEND (" + (resendApiKey ? "Yes" : "No") + "), SMTP Host (" + (emailHost ? "Yes" : "No") + "), Gmail User (" + (emailUser ? "Yes" : "No") + ")");
  return null;
}

// Branded email template
function getEmailTemplate(content, title = "ReCode") {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); display: inline-block; padding: 12px 24px; border-radius: 12px;">
        <h1 style="margin: 0; color: #0b0f19; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">
          ⚡ ReCode
        </h1>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
        Master DSA, One Problem at a Time
      </p>
    </div>
    
    <!-- Content Card -->
    <div style="background-color: #111827; border: 1px solid #374151; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">
        © ${new Date().getFullYear()} ReCode. All rights reserved.
      </p>
      <p style="margin: 8px 0 0 0;">
        You received this email because you signed up for ReCode.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

// Send verification OTP email
export async function sendVerificationEmail(to, otp) {
  const transport = getTransporter();
  if (!transport) {
    console.log("[EMAIL] Transporter not configured, OTP:", otp);
    return false;
  }
  
  const content = `
    <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px 0; text-align: center;">
      Verify Your Email
    </h2>
    <p style="color: #9ca3af; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      Welcome to ReCode! Use the code below to verify your email address.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); padding: 16px 32px; border-radius: 12px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0b0f19;">
          ${otp}
        </span>
      </div>
    </div>
    <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
      This code expires in <strong style="color: #eab308;">2 minutes</strong>.<br>
      If you didn't request this, please ignore this email.
    </p>
  `;
  
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM && process.env.EMAIL_FROM.includes('<') ? process.env.EMAIL_FROM : `"ReCode" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: "Verify Your Email - ReCode",
      html: getEmailTemplate(content, "Verify Email"),
    });
    console.log("[EMAIL] Verification email sent to:", to);
    return true;
  } catch (error) {
    console.error("[EMAIL] Send error:", error.message);
    return false;
  }
}

// Send password reset OTP email
export async function sendPasswordResetEmail(to, otp) {
  const transport = getTransporter();
  if (!transport) {
    console.log("[EMAIL] Transporter not configured, OTP:", otp);
    return false;
  }
  
  const content = `
    <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px 0; text-align: center;">
      Reset Your Password
    </h2>
    <p style="color: #9ca3af; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      You requested a password reset. Use the code below to reset your password.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); padding: 16px 32px; border-radius: 12px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0b0f19;">
          ${otp}
        </span>
      </div>
    </div>
    <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
      This code expires in <strong style="color: #eab308;">2 minutes</strong>.<br>
      If you didn't request this, your account is safe - just ignore this email.
    </p>
  `;
  
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM && process.env.EMAIL_FROM.includes('<') ? process.env.EMAIL_FROM : `"ReCode" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: "Password Reset - ReCode",
      html: getEmailTemplate(content, "Password Reset"),
    });
    console.log("[EMAIL] Password reset email sent to:", to);
    return true;
  } catch (error) {
    console.error("[EMAIL] Send error:", error.message);
    return false;
  }
}
