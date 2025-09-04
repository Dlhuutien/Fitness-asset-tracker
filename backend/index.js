require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const { CognitoJwtVerifier } = require('aws-jwt-verify');
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

// ======== ENV ========
const PORT = process.env.PORT || 3000;
const REGION = process.env.AWS_REGION; // e.g. 'ap-southeast-1'
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID; // e.g. 'ap-southeast-1_XXXX'
const CLIENT_ID = process.env.COGNITO_CLIENT_ID; // App client id
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET || null; // optional; needed if your app client has a secret

if (!REGION || !USER_POOL_ID || !CLIENT_ID) {
  throw new Error('Missing required env: AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID');
}

// ======== AWS SDK client ========
const cip = new CognitoIdentityProviderClient({ region: REGION });

// ======== Helpers ========
function secretHash(username) {
  if (!CLIENT_SECRET) return undefined; // if client has no secret, omit
  const msg = `${username}${CLIENT_ID}`;
  return crypto.createHmac('sha256', CLIENT_SECRET).update(msg).digest('base64');
}

// verifier for Access Tokens (use for API auth)
const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'access',
  clientId: CLIENT_ID,
});

// (optional) verifier for ID Tokens
const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: CLIENT_ID,
});

// Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ======== Auth Endpoints ========
// POST /auth/signup
// body: { username, password, email, role? (one of super-admin|admin|operator|technician) }
app.post('/auth/signup', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'username, password, email are required' });
    }

    const params = {
      ClientId: CLIENT_ID,
      Username: username,
      Password: password,
      SecretHash: secretHash(username),
      UserAttributes: [
        { Name: 'email', Value: email },
        // { Name: 'phone_number', Value: phone },
        // { Name: 'email_verified', Value: 'true' },
         // optional; set true only if you actually verify email elsewhere
      ],
    };

    const out = await cip.send(new SignUpCommand(params));

    // Optionally, add user to a Cognito Group for RBAC (requires AWS credentials with permission)
    if (role) {
      const allowed = ['super-admin', 'admin', 'operator', 'technician'];
      if (!allowed.includes(role)) {
        return res.status(400).json({ error: `invalid role. Use one of ${allowed.join(', ')}` });
      }
      await cip.send(new AdminAddUserToGroupCommand({
        GroupName: role,
        Username: username,
        UserPoolId: USER_POOL_ID,
      }));
    }

    return res.status(200).json({ message: 'signed up', userConfirmed: out.UserConfirmed, codeDelivery: out.CodeDeliveryDetails });
  } catch (err) {
    return res.status(400).json({ error: err.name || 'SignupError', message: err.message });
  }
});

// POST /auth/confirm
// body: { username, code }
app.post('/auth/confirm', async (req, res) => {
  try {
    const { username, code } = req.body;
    if (!username || !code) return res.status(400).json({ error: 'username and code are required' });

    await cip.send(new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: username,
      ConfirmationCode: code,
      SecretHash: secretHash(username),
    }));

    return res.json({ message: 'account confirmed' });
  } catch (err) {
    return res.status(400).json({ error: err.name || 'ConfirmError', message: err.message });
  }
});

// POST /auth/signin
// body: { username, password }
app.post('/auth/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password are required' });

    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };

    const sh = secretHash(username);
    if (sh) params.AuthParameters.SECRET_HASH = sh; // critical when app client has a secret

    const out = await cip.send(new InitiateAuthCommand(params));
    const tokens = out.AuthenticationResult;
    return res.json({
      idToken: tokens.IdToken,
      accessToken: tokens.AccessToken,
      refreshToken: tokens.RefreshToken,
      expiresIn: tokens.ExpiresIn,
      tokenType: tokens.TokenType,
    });
  } catch (err) {
    return res.status(400).json({ error: err.name || 'SigninError', message: err.message });
  }
});

// POST /auth/refresh
// body: { refreshToken, username }
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken, username } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };
    const sh = username ? secretHash(username) : undefined;
    if (sh) params.AuthParameters.SECRET_HASH = sh;

    const out = await cip.send(new InitiateAuthCommand(params));
    const tokens = out.AuthenticationResult;
    return res.json({
      idToken: tokens.IdToken,
      accessToken: tokens.AccessToken,
      expiresIn: tokens.ExpiresIn,
      tokenType: tokens.TokenType,
    });
  } catch (err) {
    return res.status(400).json({ error: err.name || 'RefreshError', message: err.message });
  }
});

// ======== RBAC middleware ========
// Extract Bearer token and verify Access Token
async function verifyAccessToken(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' });

    const payload = await accessTokenVerifier.verify(token);
    req.user = payload; // includes username ("username"), scope, and cognito:groups if set
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', message: err.message });
  }
}

// roles based on Cognito Groups: payload["cognito:groups"] is an array
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const groups = req.user && (req.user['cognito:groups'] || []);
    const ok = groups.some((g) => allowedRoles.includes(g));
    if (!ok) return res.status(403).json({ error: 'Forbidden', message: `Requires one of roles: ${allowedRoles.join(', ')}` });
    next();
  };
}

// ======== Demo Protected Routes ========
app.get('/me', verifyAccessToken, async (req, res) => {
  res.json({
    sub: req.user.sub,
    username: req.user.username,
    scope: req.user.scope,
    groups: req.user['cognito:groups'] || [],
    token_use: req.user.token_use,
    exp: req.user.exp,
    iat: req.user.iat,
  });
});

app.get('/admin-only', verifyAccessToken, requireRole('admin', 'super-admin'), (req, res) => {
  res.json({ message: 'Welcome admin(s)!' });
});

app.get('/super-admin-only', verifyAccessToken, requireRole('super-admin'), (req, res) => {
  res.json({ message: 'Welcome super admin!' });
});

app.get('/tech-or-operator', verifyAccessToken, requireRole('technician', 'operator', 'admin', 'super-admin'), (req, res) => {
  res.json({ message: 'Hello technician/operator/admin/super-admin' });
});

// ======== (Optional) Admin provision user via API ========
// Requires your server to run with AWS credentials that allow these actions.
// POST /admin/create-user  body: { username, email, password, role }
app.post('/admin/create-user', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'username, email, password required' });

    await cip.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
      MessageAction: 'SUPPRESS', // don't email temp password
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

    res.json({ message: 'admin created user' });
  } catch (err) {
    res.status(400).json({ error: err.name || 'AdminCreateError', message: err.message });
  }
});

// Health
app.get('/', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
