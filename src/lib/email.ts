import nodemailer from "nodemailer";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(options: EmailOptions) {
  try {
    // Validate SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP configuration is missing in environment variables");
    }

    console.log("Creating email transporter with:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER
    });

    // Create transporter using SMTP settings from environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Miller Storm OS" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });

    console.log("Email sent successfully. Message ID:", info.messageId);
    return info;
  } catch (error: any) {
    console.error("Email sending error:", error.message || error);
    throw error;
  }
}

export function generatePasswordResetEmail(name: string, resetLink: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Miller Storm Operating System
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px;">
                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                    Hi ${name},
                  </p>
                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                    We received a request to reset your password for your Miller Storm OS account.
                  </p>
                  <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                    Click the button below to reset your password:
                  </p>
                  
                  <!-- Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 0 0 24px 0;">
                        <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="margin: 0 0 24px 0; color: #2563eb; font-size: 14px; word-break: break-all;">
                    ${resetLink}
                  </p>
                  
                  <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    This link will expire in 1 hour for security reasons.
                  </p>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    If you didn't request a password reset, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                    © 2026-2027 Miller Storm. All Rights Reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Hi ${name},

We received a request to reset your password for your Miller Storm OS account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

© 2026-2027 Miller Storm. All Rights Reserved.
  `;

  return { html, text };
}

export function generateRegistrationConfirmationEmail(name: string, email: string, role: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Request Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Miller Storm Operating System
                  </h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 20px 40px;">
                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                    Hi ${name},
                  </p>
                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                    Thank you for requesting access to the Miller Storm Operating System.
                  </p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; margin: 24px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Registration Details:</p>
                        <p style="margin: 0 0 4px 0; color: #374151; font-size: 14px;"><strong>Name:</strong> ${name}</p>
                        <p style="margin: 0 0 4px 0; color: #374151; font-size: 14px;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Requested Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                    Your request is currently <strong style="color: #f59e0b;">pending approval</strong>.
                  </p>
                  
                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                    Our admin team will review your request and approve it within <strong>24 to 48 hours</strong>.
                  </p>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    You will receive another email once your account has been approved and is ready to use.
                  </p>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                    © 2026-2027 Miller Storm. All Rights Reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Hi ${name},

Thank you for requesting access to the Miller Storm Operating System.

Registration Details:
- Name: ${name}
- Email: ${email}
- Requested Role: ${role.charAt(0).toUpperCase() + role.slice(1)}

Your request is currently pending approval.

Our admin team will review your request and approve it within 24 to 48 hours.

You will receive another email once your account has been approved and is ready to use.

© 2026-2027 Miller Storm. All Rights Reserved.
  `;

  return { html, text };
}
