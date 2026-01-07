/**
 * Comprehensive OAuth2 Diagnostics
 * Checks all aspects of the Gmail OAuth2 setup
 */

import dotenv from 'dotenv';
dotenv.config();

import https from 'https';
import querystring from 'querystring';

async function diagnoseOAuth2() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE GMAIL OAUTH2 DIAGNOSTICS                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_CLIENT_ID = process.env.EMAIL_CLIENT_ID;
  const EMAIL_CLIENT_SECRET = process.env.EMAIL_CLIENT_SECRET;
  const EMAIL_REFRESH_TOKEN = process.env.EMAIL_REFRESH_TOKEN;

  // Step 1: Check environment variables
  console.log('📋 STEP 1: Environment Variables Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('EMAIL_USER:', EMAIL_USER || '❌ NOT SET');
  console.log('EMAIL_CLIENT_ID:', EMAIL_CLIENT_ID ? '✅ SET (' + EMAIL_CLIENT_ID.substring(0, 30) + '...)' : '❌ NOT SET');
  console.log('EMAIL_CLIENT_SECRET:', EMAIL_CLIENT_SECRET ? '✅ SET (' + EMAIL_CLIENT_SECRET.substring(0, 15) + '...)' : '❌ NOT SET');
  console.log('EMAIL_REFRESH_TOKEN:', EMAIL_REFRESH_TOKEN ? '✅ SET (' + EMAIL_REFRESH_TOKEN.substring(0, 20) + '...)' : '❌ NOT SET');
  console.log('');

  if (!EMAIL_USER || !EMAIL_CLIENT_ID || !EMAIL_CLIENT_SECRET || !EMAIL_REFRESH_TOKEN) {
    console.error('❌ Missing required OAuth2 credentials!');
    process.exit(1);
  }

  // Step 2: Test refresh token
  console.log('📡 STEP 2: Testing Refresh Token');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const postData = querystring.stringify({
    client_id: EMAIL_CLIENT_ID,
    client_secret: EMAIL_CLIENT_SECRET,
    refresh_token: EMAIL_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });

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
        console.log('Response Status Code:', res.statusCode);
        
        try {
          const tokenResponse = JSON.parse(data);
          
          if (tokenResponse.error) {
            console.log('❌ FAILED to generate access token');
            console.log('');
            console.log('Error:', tokenResponse.error);
            console.log('Description:', tokenResponse.error_description);
            console.log('');
            console.log('🔍 This means:');
            console.log('   - The refresh token is invalid or expired');
            console.log('   - The Client ID/Secret don\'t match the refresh token');
            console.log('   - The refresh token was revoked');
            console.log('');
            process.exit(1);
          }

          console.log('✅ SUCCESS! Access token generated');
          console.log('');
          console.log('Token Details:');
          console.log('  Access Token:', tokenResponse.access_token.substring(0, 30) + '...');
          console.log('  Expires In:', tokenResponse.expires_in, 'seconds');
          console.log('  Scope:', tokenResponse.scope);
          console.log('  Token Type:', tokenResponse.token_type);
          console.log('');

          // Step 3: Check token info
          console.log('🔍 STEP 3: Checking Token Information');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          https.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${tokenResponse.access_token}`, (res2) => {
            let tokenInfo = '';
            res2.on('data', (chunk) => tokenInfo += chunk);
            res2.on('end', () => {
              try {
                const info = JSON.parse(tokenInfo);
                console.log('Access Token Info:');
                console.log('  Audience:', info.aud);
                console.log('  Client ID Match:', info.azp === EMAIL_CLIENT_ID ? '✅ YES' : '❌ NO');
                console.log('  Scope:', info.scope);
                console.log('  Expires At:', new Date(parseInt(info.exp) * 1000).toISOString());
                console.log('');

                // Check scope
                if (info.scope && info.scope.includes('gmail.send')) {
                  console.log('✅ Token has gmail.send scope');
                } else {
                  console.log('❌ Token MISSING gmail.send scope!');
                  console.log('   Current scope:', info.scope);
                  console.log('   Required scope: https://www.googleapis.com/auth/gmail.send');
                  console.log('');
                  console.log('🔧 FIX: Regenerate token with correct scope');
                }
                console.log('');

                // Step 4: Try to get user info
                console.log('👤 STEP 4: Attempting to Get User Info');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                
                https.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenResponse.access_token}`, (res3) => {
                  let userData = '';
                  res3.on('data', (chunk) => userData += chunk);
                  res3.on('end', () => {
                    try {
                      const userInfo = JSON.parse(userData);
                      
                      if (userInfo.error) {
                        console.log('⚠️  Cannot retrieve user info (scope not included)');
                        console.log('   This is OK - userinfo scope is not required for sending emails');
                      } else if (userInfo.email) {
                        console.log('User Information:');
                        console.log('  Email:', userInfo.email);
                        console.log('  Name:', userInfo.name || 'N/A');
                        console.log('  Verified:', userInfo.verified_email ? '✅ Yes' : '❌ No');
                        console.log('');
                        
                        if (userInfo.email === EMAIL_USER) {
                          console.log('✅ EMAIL MATCHES! Token is for:', EMAIL_USER);
                        } else {
                          console.log('❌ EMAIL MISMATCH!');
                          console.log('   Expected:', EMAIL_USER);
                          console.log('   Got:', userInfo.email);
                        }
                      }
                      console.log('');

                      // Step 5: Final recommendations
                      console.log('╔══════════════════════════════════════════════════════════════╗');
                      console.log('║     DIAGNOSIS SUMMARY                                        ║');
                      console.log('╚══════════════════════════════════════════════════════════════╝');
                      console.log('');
                      console.log('The access token is generated successfully, but Gmail rejects it.');
                      console.log('');
                      console.log('🔍 MOST LIKELY CAUSES:');
                      console.log('');
                      console.log('1️⃣  WRONG GOOGLE ACCOUNT');
                      console.log('   The refresh token was generated by signing in with a DIFFERENT');
                      console.log('   Google account than:', EMAIL_USER);
                      console.log('');
                      console.log('   ✅ FIX: Go to OAuth Playground and sign in with', EMAIL_USER);
                      console.log('');
                      console.log('2️⃣  GMAIL API NOT ENABLED');
                      console.log('   The Gmail API might not be enabled in Google Cloud Console');
                      console.log('   for project:', EMAIL_CLIENT_ID.split('-')[0]);
                      console.log('');
                      console.log('   ✅ FIX: Enable Gmail API at:');
                      console.log('   https://console.cloud.google.com/apis/library/gmail.googleapis.com');
                      console.log('');
                      console.log('3️⃣  OAUTH CONSENT SCREEN ISSUES');
                      console.log('   The OAuth consent screen might not be properly configured');
                      console.log('   or the app is in testing mode without', EMAIL_USER, 'as a test user');
                      console.log('');
                      console.log('   ✅ FIX: Add', EMAIL_USER, 'as a test user in OAuth consent screen:');
                      console.log('   https://console.cloud.google.com/apis/credentials/consent');
                      console.log('');
                      console.log('4️⃣  CLIENT ID/SECRET MISMATCH');
                      console.log('   The refresh token was generated with DIFFERENT OAuth credentials');
                      console.log('');
                      console.log('   ✅ FIX: Regenerate token using THESE EXACT credentials:');
                      console.log('   Client ID:', EMAIL_CLIENT_ID);
                      console.log('');
                      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                      console.log('');
                      console.log('📝 RECOMMENDATION:');
                      console.log('   1. Check if Gmail API is enabled in Google Cloud Console');
                      console.log('   2. Add', EMAIL_USER, 'as test user in OAuth consent screen');
                      console.log('   3. Regenerate refresh token, ensuring you sign in with', EMAIL_USER);
                      console.log('');

                    } catch (e) {
                      console.log('⚠️  Could not parse user info (this is OK)');
                      console.log('');
                    }
                  });
                }).on('error', (error) => {
                  console.log('⚠️  Could not fetch user info:', error.message);
                  console.log('');
                });

              } catch (e) {
                console.error('❌ Failed to parse token info:', e.message);
              }
            });
          }).on('error', (error) => {
            console.error('❌ Failed to fetch token info:', error.message);
          });

        } catch (e) {
          console.error('❌ Failed to parse response:', e.message);
          console.error('Response:', data);
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

diagnoseOAuth2().catch(console.error);
