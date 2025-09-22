require('dotenv').config();
const crypto = require('crypto');
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');

const REGION = process.env.AWS_REGION; 
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET || null;

if (!REGION || !USER_POOL_ID || !CLIENT_ID) {
  throw new Error('Missing required env: AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID');
}

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

// ======== AWS SDK v3 client ========
// const cip = new CognitoIdentityProviderClient({ region: REGION });
const cip = new CognitoIdentityProviderClient({ region: REGION, credentials });


// ======== DynamoDB v3 ========
// const ddbClient = new DynamoDBClient({ region: REGION });
const ddbClient = new DynamoDBClient({ region: REGION, credentials });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);


// ======== S3 ========
// const s3 = new S3Client({ region: REGION });
const s3 = new S3Client({ region: REGION, credentials });

// ======== Helpers ========
function secretHash(username) {
  if (!CLIENT_SECRET) return undefined;
  const msg = `${username}${CLIENT_ID}`;
  return crypto.createHmac('sha256', CLIENT_SECRET).update(msg).digest('base64');
}

module.exports = { cip, secretHash, CLIENT_ID, USER_POOL_ID, CLIENT_SECRET, dynamodb, s3 };