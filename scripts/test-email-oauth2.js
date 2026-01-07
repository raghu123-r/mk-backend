/**
 * Test Email Script - Gmail API with OAuth2
 * Tests the Gmail API email configuration
 */

import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';

async function testEmail() {
  console.log('🧪 Testing Gmail API Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
  console.log('  EMAIL_CLIENT_ID:', process.env.EMAIL_CLIENT_ID ? '✅ SET' : '❌ NOT SET');
  console.log('  EMAIL_CLIENT_SECRET:', process.env.EMAIL_CLIENT_SECRET ? '✅ SET' : '❌ NOT SET');
  console.log('  EMAIL_REFRESH_TOKEN:', process.env.EMAIL_REFRESH_TOKEN ? '✅ SET' : '❌ NOT SET');
  console.log('');

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_CLIENT_ID = process.env.EMAIL_CLIENT_ID;
  const EMAIL_CLIENT_SECRET = process.env.EMAIL_CLIENT_SECRET;
  const EMAIL_REFRESH_TOKEN = process.env.EMAIL_REFRESH_TOKEN;

  if (!EMAIL_USER || !EMAIL_CLIENT_ID || !EMAIL_CLIENT_SECRET || !EMAIL_REFRESH_TOKEN) {
    console.error('❌ Missing required OAuth2 credentials!');
    process.exit(1);
  }

  try {
    // Create OAuth2 client
    console.log('🔧 Creating Gmail API OAuth2 client...');
    const oauth2Client = new google.auth.OAuth2(
      EMAIL_CLIENT_ID,
      EMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: EMAIL_REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    console.log('✅ Gmail API client created successfully!\n');

    // Create test email
    console.log(`📧 Sending test email via Gmail API`);
    console.log(`   To: ${EMAIL_USER}`);
    console.log(`   From: ${EMAIL_USER}`);
    console.log(`   Subject: OAuth2 Email Test – SUCCESS\n`);
    
    const subject = 'OAuth2 Email Test – SUCCESS';
    const text = `Gmail API OAuth2 Email Test

This email confirms that your Gmail API OAuth2 setup is working correctly!

✅ Gmail API authentication: SUCCESS
✅ OAuth2 token refresh: SUCCESS
✅ Email sent via Gmail API: SUCCESS

Configuration Details:
- Email Account: ${EMAIL_USER}
- OAuth2 Client ID: ${EMAIL_CLIENT_ID.substring(0, 30)}...
- OAuth Scope: https://www.googleapis.com/auth/gmail.send
- API Method: gmail.users.messages.send
- Authentication Type: OAuth2

Timestamp: ${new Date().toISOString()}

This is an automated test email from Kitchen Kettles Backend using Gmail API.
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center; }
    .content { background: #ffffff; padding: 30px; }
    .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .details { background: #f9fafb; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    h1 { margin: 0; font-size: 28px; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Gmail API Test SUCCESS</h1>
      <p style="margin: 10px 0 0 0;">Kitchen Kettles Backend</p>
    </div>
    <div class="content">
      <h2 style="color: #1E40AF;">Gmail API OAuth2 Working!</h2>
      <p>This email confirms that your Gmail API OAuth2 setup is working correctly!</p>
      
      <div class="success">
        <strong>✅ All Systems Operational</strong><br>
        • Gmail API authentication: SUCCESS<br>
        • OAuth2 token refresh: SUCCESS<br>
        • Email sent via Gmail API: SUCCESS
      </div>

      <div class="details">
        <strong>📋 Configuration Details:</strong><br><br>
        <strong>Email Account:</strong> <code>${EMAIL_USER}</code><br>
        <strong>OAuth2 Client ID:</strong> <code>${EMAIL_CLIENT_ID.substring(0, 30)}...</code><br>
        <strong>OAuth Scope:</strong> <code>https://www.googleapis.com/auth/gmail.send</code><br>
        <strong>API Method:</strong> <code>gmail.users.messages.send</code><br>
        <strong>Authentication:</strong> <code>OAuth2</code><br>
        <strong>Timestamp:</strong> ${new Date().toISOString()}
      </div>

      <p>Your backend is now ready to send OTP emails using Gmail API!</p>
    </div>
    <div class="footer">
      <p>This is an automated test email from Kitchen Kettles Backend</p>
      <p>© ${new Date().getFullYear()} Kitchen Kettles. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Create raw email message
    const from = `"Kitchen Kettles Gmail API Test" <${EMAIL_USER}>`;
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const messageParts = [
      `From: ${from}`,
      `To: ${EMAIL_USER}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      '',
      text,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      html,
      '',
      `--${boundary}--`
    ];

    const message = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📨 Message Details:');
    console.log('   Gmail Message ID:', response.data.id);
    console.log('   Thread ID:', response.data.threadId);
    console.log('   Label IDs:', response.data.labelIds?.join(', ') || 'None');
    console.log('');
    console.log('📬 Check your inbox at:', EMAIL_USER);
    console.log('');
    console.log('🎉 Gmail API with OAuth2 is working perfectly!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ EMAIL TEST FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Error Message:', error.message);
    console.error('');
    if (error.response) {
      console.error('API Response:');
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      console.error('');
    }
    console.error('Full Stack Trace:');
    console.error(error.stack);
    console.error('');
    process.exit(1);
  }
}

// Run the test
testEmail();
