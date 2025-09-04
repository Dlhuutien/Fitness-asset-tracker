const adminService = require('../services/adminService');

exports.createUser = async (req, res) => {
  try {
    const result = await adminService.createUser(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};
