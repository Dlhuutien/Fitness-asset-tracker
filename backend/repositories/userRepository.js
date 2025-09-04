const { cip, secretHash, CLIENT_ID, USER_POOL_ID, CLIENT_SECRET } = require('../utils/aws-helper');
const {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand
} = require('@aws-sdk/client-cognito-identity-provider');

exports.signUp = async (username, password, email, role) => {
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
    Password: password,
    SecretHash: secretHash(username),
    UserAttributes: [{ Name: 'email', Value: email }],
    // MessageAction: 'SUPPRESS', // không gửi email
  };
  
  const out = await cip.send(new SignUpCommand(params));
  if (role) {
    await cip.send(new AdminAddUserToGroupCommand({
      GroupName: role,
      Username: username,
      UserPoolId: USER_POOL_ID,
    }));
  }

  return { message: 'signed up', userConfirmed: out.UserConfirmed };
};

exports.confirmSignUp = async ({ username, code, role }) => {
  await cip.send(new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: username,
    ConfirmationCode: code,
    SecretHash: secretHash(username),
  }));

  if (role) {
    await cip.send(new AdminAddUserToGroupCommand({
      GroupName: role,
      Username: username,
      UserPoolId: USER_POOL_ID,
    }));
  }

  return { message: 'account confirmed' };
};


exports.signIn = async ({ username, password }) => {
  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: username, PASSWORD: password },
  };
  const sh = secretHash(username);
  if (sh) params.AuthParameters.SECRET_HASH = sh;

  const out = await cip.send(new InitiateAuthCommand(params));
  const tokens = out.AuthenticationResult;
  return {
    idToken: tokens.IdToken,
    accessToken: tokens.AccessToken,
    refreshToken: tokens.RefreshToken,
    expiresIn: tokens.ExpiresIn,
    tokenType: tokens.TokenType,
  };
};

exports.refreshToken = async ({ refreshToken, username }) => {
  const params = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  };
  const sh = username ? secretHash(username) : undefined;
  if (sh) params.AuthParameters.SECRET_HASH = sh;

  const out = await cip.send(new InitiateAuthCommand(params));
  const tokens = out.AuthenticationResult;
  return {
    idToken: tokens.IdToken,
    accessToken: tokens.AccessToken,
    expiresIn: tokens.ExpiresIn,
    tokenType: tokens.TokenType,
  };
};

exports.adminCreateUser = async ({ username, email, password, role }) => {
  await cip.send(new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    UserAttributes: [{ Name: 'email', Value: email }, { Name: 'email_verified', Value: 'true' }],
    MessageAction: 'SUPPRESS',
  }));

  await cip.send(new AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    Password: password,
    Permanent: true,
  }));

  if (role) {
    await cip.send(new AdminAddUserToGroupCommand({
      GroupName: role,
      Username: username,
      UserPoolId: USER_POOL_ID,
    }));
  }

  return { message: 'admin created user' };
};