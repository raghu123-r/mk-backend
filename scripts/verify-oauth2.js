/**
 * OAuth2 Token Verification Script
 * Tests if we can get an access token from the refresh token
 */

import dotenv from 'dotenv';
dotenv.config();

import https from 'https';
import querystring from 'querystring';

async function testOAuth2Token() {
  console.log('🔍 Testing OAuth2 Token Generation...\n');
  
  const clientId = process.env.EMAIL_CLIENT_ID;
  const clientSecret = process.env.EMAIL_CLIENT_SECRET;
  const refreshToken = process.env.EMAIL_REFRESH_TOKEN;
  const emailUser = process.env.EMAIL_USER;

  console.log('Configuration:');
  console.log('  Email:', emailUser);
  console.log('  Client ID:', clientId ? `${clientId.substring(0, 30)}...` : '❌ NOT SET');
  console.log('  Client Secret:', clientSecret ? `${clientSecret.substring(0, 10)}...` : '❌ NOT SET');
  console.log('  Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : '❌ NOT SET');
  console.log('');

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Missing OAuth2 credentials!');
    process.exit(1);
  }

  const postData = querystring.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const options = {
    hostname: 'oauth2.googleapis.com',
    port: 443,
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('📡 Requesting access token from Google OAuth2...');
  console.log('   Endpoint: https://oauth2.googleapis.com/token');
  console.log('');

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Body:', data);
        console.log('');

        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            console.error('❌ ERROR:', response.error);
            console.error('   Description:', response.error_description);
            console.error('');
            console.error('🔍 Common causes:');
            console.error('   1. Client ID and Client Secret don\'t match');
            console.error('   2. Refresh token was generated for a different OAuth2 client');
            console.error('   3. Refresh token has expired or been revoked');
            console.error('   4. OAuth2 client redirect URI doesn\'t match what was used to generate the token');
            console.error('');
            console.error('💡 Solutions:');
            console.error('   1. Go to https://developers.google.com/oauthplayground');
            console.error('   2. Click gear icon (⚙️) in top right');
            console.error('   3. Check "Use your own OAuth credentials"');
            console.error('   4. Enter YOUR Client ID and Client Secret');
            console.error('   5. In Step 1, add scope: https://www.googleapis.com/auth/gmail.send');
            console.error('   6. Click "Authorize APIs"');
            console.error('   7. In Step 2, click "Exchange authorization code for tokens"');
            console.error('   8. Copy the NEW refresh token');
            process.exit(1);
          } else {
            console.log('✅ SUCCESS! Access token obtained!');
            console.log('   Access Token:', response.access_token.substring(0, 30) + '...');
            console.log('   Expires In:', response.expires_in, 'seconds');
            console.log('   Token Type:', response.token_type);
            console.log('');
            console.log('🎉 Your OAuth2 credentials are working correctly!');
            console.log('   Email sending should work now.');
          }
        } catch (e) {
          console.error('❌ Failed to parse response:', e.message);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

testOAuth2Token();
