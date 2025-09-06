const { CognitoJwtVerifier } = require('aws-jwt-verify');
const { USER_POOL_ID, CLIENT_ID } = require('../utils/aws-helper');

const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'access',
  clientId: CLIENT_ID,
});

const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: CLIENT_ID,
});

module.exports = { accessTokenVerifier, idTokenVerifier };
