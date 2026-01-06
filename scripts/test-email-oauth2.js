/**
 * Test Email Script - OAuth2
 * Tests the Gmail OAuth2 email configuration
 */

import dotenv from 'dotenv';
dotenv.config();

import { sendOTPEmail, sendWelcomeEmail } from '../src/utils/email.js';

async function testEmail() {
  console.log('🧪 Testing Email Configuration with OAuth2...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
  console.log('  EMAIL_CLIENT_ID:', process.env.EMAIL_CLIENT_ID ? '✅ SET' : '❌ NOT SET');
  console.log('  EMAIL_CLIENT_SECRET:', process.env.EMAIL_CLIENT_SECRET ? '✅ SET' : '❌ NOT SET');
  console.log('  EMAIL_REFRESH_TOKEN:', process.env.EMAIL_REFRESH_TOKEN ? '✅ SET' : '❌ NOT SET');
  console.log('');

  const testEmail = process.env.EMAIL_USER || 'hrudhay@italliancetech.com';
  const testOTP = '123456';
  const testUsername = 'Test User';

  try {
    console.log(`📧 Sending test OTP email to: ${testEmail}`);
    console.log(`   OTP Code: ${testOTP}\n`);
    
    await sendOTPEmail(testEmail, testOTP, testUsername);
    
    console.log('✅ SUCCESS! OTP Email sent successfully!');
    console.log('');
    console.log('📬 Please check your inbox at:', testEmail);
    console.log('');
    
    // Optional: Test welcome email too
    const sendWelcome = process.argv.includes('--welcome');
    if (sendWelcome) {
      console.log('📧 Sending test Welcome email...\n');
      await sendWelcomeEmail(testEmail, testUsername);
      console.log('✅ Welcome email sent successfully!');
    } else {
      console.log('💡 Tip: Add --welcome flag to also test the welcome email');
    }
    
  } catch (error) {
    console.error('❌ ERROR sending email:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    console.error('');
    console.error('🔍 Troubleshooting:');
    console.error('   1. Verify OAuth2 credentials in .env file');
    console.error('   2. Check if refresh token is still valid');
    console.error('   3. Ensure Gmail API is enabled in Google Cloud Console');
    console.error('   4. Check if email address matches the OAuth2 credentials');
    process.exit(1);
  }
}

// Run the test
testEmail();
