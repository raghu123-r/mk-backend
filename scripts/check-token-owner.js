/**
 * Check which Gmail account owns the current refresh token
 */

import dotenv from 'dotenv';
dotenv.config();

import https from 'https';
import querystring from 'querystring';

async function checkTokenOwner() {
  console.log('🔍 Checking OAuth2 Refresh Token Owner...\n');

  const clientId = process.env.EMAIL_CLIENT_ID;
  const clientSecret = process.env.EMAIL_CLIENT_SECRET;
  const refreshToken = process.env.EMAIL_REFRESH_TOKEN;
  const emailUser = process.env.EMAIL_USER;

  console.log('Current Configuration:');
  console.log('  EMAIL_USER in .env:', emailUser);
  console.log('  Client ID:', clientId ? `${clientId.substring(0, 30)}...` : '❌ NOT SET');
  console.log('  Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : '❌ NOT SET');
  console.log('');

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Missing OAuth2 credentials!');
    process.exit(1);
  }

  // Step 1: Get access token from refresh token
  const postData = querystring.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  console.log('📡 Step 1: Getting access token from refresh token...');

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const tokenResponse = JSON.parse(data);
          
          if (tokenResponse.error) {
            console.error('❌ ERROR:', tokenResponse.error);
            console.error('   Description:', tokenResponse.error_description);
            process.exit(1);
          }

          console.log('✅ Access token obtained!\n');

          // Step 2: Get user info from access token
          console.log('📡 Step 2: Fetching user info from Google...');
          
          https.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenResponse.access_token}`, (res2) => {
            let userData = '';
            res2.on('data', (chunk) => userData += chunk);
            res2.on('end', () => {
              try {
                const userInfo = JSON.parse(userData);
                
                console.log('');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📋 REFRESH TOKEN OWNER INFORMATION');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('');
                console.log('Authorized Gmail Account:');
                console.log('  Email:', userInfo.email || 'Unknown');
                console.log('  Name:', userInfo.name || 'Unknown');
                console.log('  Verified:', userInfo.verified_email ? '✅ Yes' : '❌ No');
                console.log('  User ID:', userInfo.id || 'Unknown');
                console.log('');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('');

                if (userInfo.email === emailUser) {
                  console.log('✅ TOKEN MATCHES! The refresh token is authorized for:', emailUser);
                  console.log('   Your configuration is correct.');
                  console.log('');
                  console.log('   If emails still fail, the issue might be:');
                  console.log('   1. Gmail API not enabled in Google Cloud Console');
                  console.log('   2. OAuth consent screen not properly configured');
                  console.log('   3. Account security settings blocking the app');
                } else {
                  console.log('❌ TOKEN MISMATCH!');
                  console.log('');
                  console.log('   Expected email (EMAIL_USER):', emailUser);
                  console.log('   Actual authorized email:    ', userInfo.email || 'Unknown');
                  console.log('');
                  console.log('🔧 ACTION REQUIRED:');
                  console.log('   You MUST generate a NEW refresh token for:', emailUser);
                  console.log('');
                  console.log('   Steps:');
                  console.log('   1. Go to: https://developers.google.com/oauthplayground');
                  console.log('   2. Click gear icon → "Use your own OAuth credentials"');
                  console.log('   3. Enter your Client ID and Secret');
                  console.log(`   4. Sign in with: ${emailUser}`);
                  console.log('   5. Select scope: https://www.googleapis.com/auth/gmail.send');
                  console.log('   6. Generate and copy the new refresh token');
                  console.log('   7. Update EMAIL_REFRESH_TOKEN in .env');
                  console.log('');
                }

                resolve();
              } catch (e) {
                console.error('❌ Failed to parse user info:', e.message);
                reject(e);
              }
            });
          }).on('error', (error) => {
            console.error('❌ Failed to fetch user info:', error.message);
            reject(error);
          });
        } catch (e) {
          console.error('❌ Failed to parse token response:', e.message);
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

checkTokenOwner().catch(console.error);
