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

exports.createUser = async (req, res) => {
  try {
    const creatorRole = req.user?.['cognito:groups']?.[0]; // lấy role từ token
    if (!creatorRole) {
      return res.status(403).json({ error: "Forbidden", message: "User role is missing" });
    }

    const result = await userService.createUser(req.body, creatorRole);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized", message: "Access token missing" });
    }

    const { oldPassword, newPassword } = req.body;
    const result = await userService.changePassword({ accessToken, oldPassword, newPassword });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.updateInfo = async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized", message: "Access token missing" });
    }

    // ví dụ: { name: "...", phone_number: "...", address: "..." }
    const attributes = req.body; 
    const result = await userService.updateUserAttributes({accessToken, attributes});
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const updatedByRole = req.user['cognito:groups']?.[0];
    const { username, enabled } = req.body;  // đổi status -> enabled

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "ValidationError", message: "enabled must be boolean (true/false)" });
    }

    const result = await userService.updateUserStatus({ username, enabled, updatedByRole });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.adminUpdateUserAttributes = async (req, res) => {
  try {
    const updatedByRole = req.user?.['cognito:groups']?.[0];
    if (!updatedByRole) {
      return res.status(403).json({ error: "Forbidden", message: "User role is missing" });
    }

    const { username, attributes } = req.body;
    if (!username || !attributes || typeof attributes !== "object") {
      return res.status(400).json({ error: "ValidationError", message: "username and attributes are required" });
    }

    const result = await userService.adminUpdateUserAttributes({ username, attributes, updatedByRole });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const role = req.user?.['cognito:groups']?.[0];
    if (!role) {
      return res.status(403).json({ error: "Forbidden", message: "User role is missing" });
    }

    const result = await userService.listUsers(role);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.setUserRole = async (req, res) => {
  try {
    const updatedByRole = req.user?.["cognito:groups"]?.[0];
    if (!updatedByRole) {
      return res.status(403).json({ error: "Forbidden", message: "User role is missing" });
    }

    const { username, newRole } = req.body;
    if (!username || !newRole) {
      return res.status(400).json({ error: "ValidationError", message: "username and newRole are required" });
    }

    const result = await userService.setUserRole({ username, newRole, updatedByRole });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

