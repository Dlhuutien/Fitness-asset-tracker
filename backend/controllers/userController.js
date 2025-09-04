exports.getMe = async (req, res) => {
  try {
    res.json({
      sub: req.user.sub,
      username: req.user.username,
      scope: req.user.scope,
      groups: req.user['cognito:groups'] || [],
      token_use: req.user.token_use,
      exp: req.user.exp,
      iat: req.user.iat,
    });
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.adminOnly = async (req, res) => {
  res.json({ message: 'Welcome admin(s)!' });
};

exports.superAdminOnly = async (req, res) => {
  res.json({ message: 'Welcome super admin!' });
};

exports.techOrOperator = async (req, res) => {
  res.json({ message: 'Hello technician/operator/admin/super-admin' });
};
