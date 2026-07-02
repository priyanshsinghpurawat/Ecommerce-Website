import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT || 587,
      secure: (ENV.SMTP_PORT || 587) === 465,
      auth: { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS },
    });
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();

  if (!t) {
    if (ENV.NODE_ENV === 'production') {
      throw new Error('Email service is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
    }
    console.info(`\n[DEV EMAIL] To: ${to}`);
    console.info(`[DEV EMAIL] Subject: ${subject}`);
    console.info(`[DEV EMAIL] Body:\n${html}\n`);
    return;
  }

  await t.sendMail({
    from: ENV.EMAIL_FROM || 'noreply@mensvibe.com',
    to,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  const html = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:4px;">Reset Password</a>
    <p>This link expires in 15 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  await sendEmail({
    to: email,
    subject: 'MensVibe — Password Reset Request',
    html,
  });
};