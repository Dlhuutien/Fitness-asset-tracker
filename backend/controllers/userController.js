const userService = require('../services/userService');

exports.getMe = async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token missing' });
    }

    // Lấy thông tin user từ Cognito bằng accessToken
    const userInfo = await userService.getUserInfo(accessToken);

    // Lấy thêm thông tin JWT từ req.user
    const tokenInfo = {
      sub: req.user.sub,
      scope: req.user.scope,
      groups: req.user['cognito:groups'] || [],
      token_use: req.user.token_use,
      exp: req.user.exp,
      iat: req.user.iat,
    };

    res.json({
      ...tokenInfo,
      ...userInfo,
    });
  } catch (err) {
    res.status(500).json({ error: err.name, message: err.message });
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
