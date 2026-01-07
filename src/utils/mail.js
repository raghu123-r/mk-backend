/**
 * ⚠️ LEGACY FILE - NOT CURRENTLY IN USE ⚠️
 * 
 * SendGrid Email Utility (DEPRECATED)
 * 
 * This file is kept for reference but is NOT used in production.
 * The application now uses Gmail OAuth2 via src/utils/email.js
 * 
 * DO NOT USE THIS FILE. Use src/utils/email.js instead.
 * 
 * Environment Variables Required:
 * - SENDGRID_API_KEY: Your SendGrid API key
 * - FROM_EMAIL: The verified sender email address in SendGrid
 * 
 * Testing:
 * - Use temp-mail services (temp-mail.org, guerrillamail.com) for testing
 * - Check SendGrid Activity Feed if emails aren't received
 * - Verify FROM_EMAIL is verified in SendGrid dashboard
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@yourdomain.com';

if (!SENDGRID_API_KEY) {
  console.warn('⚠️  SENDGRID_API_KEY not set. Email sending will fail.');
}

sgMail.setApiKey(SENDGRID_API_KEY || 'dummy-key');

/**
 * Send an email using SendGrid
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} [options.text] - Plain text version of email
 * @param {string} [options.html] - HTML version of email
 * @returns {Promise<void>}
 * @throws {Error} If email sending fails
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }

  const msg = {
    to,
    from: FROM_EMAIL,
    subject,
    text: text || '',
    html: html || text || ''
  };

  try {
    await sgMail.send(msg);
    // Success - do NOT log the email content for security
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    // Log error without exposing sensitive content
    console.error('❌ SendGrid error:', error.response?.body || error.message);
    throw new Error('Failed to send email');
  }
}
