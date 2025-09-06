const { accessTokenVerifier } = require('../utils/cognitoHelper');

exports.verifyAccessToken = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' });

    const payload = await accessTokenVerifier.verify(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', message: err.message });
  }
};

exports.requireRole = (...allowedRoles) => (req, res, next) => {
  const groups = req.user && (req.user['cognito:groups'] || []);
  const ok = groups.some((g) => allowedRoles.includes(g));
  if (!ok) return res.status(403).json({ error: 'Forbidden', message: `Requires one of roles: ${allowedRoles.join(', ')}` });
  next();
};
