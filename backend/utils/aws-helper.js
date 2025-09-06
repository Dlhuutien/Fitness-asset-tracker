require('dotenv').config();
const crypto = require('crypto');
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');

const REGION = process.env.AWS_REGION; 
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET || null; 

if (!REGION || !USER_POOL_ID || !CLIENT_ID) {
  throw new Error('Missing required env: AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID');
}

// ======== AWS SDK client ========
const cip = new CognitoIdentityProviderClient({ region: REGION });

// ======== Helpers ========
function secretHash(username) {
  if (!CLIENT_SECRET) return undefined;
  const msg = `${username}${CLIENT_ID}`;
  return crypto.createHmac('sha256', CLIENT_SECRET).update(msg).digest('base64');
}

module.exports = { cip, secretHash, CLIENT_ID, USER_POOL_ID, CLIENT_SECRET };