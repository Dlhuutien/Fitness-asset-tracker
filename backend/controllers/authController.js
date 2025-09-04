const authService = require('../services/authService');

exports.signup = async (req, res) => {
  try {
    const result = await authService.signup(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.confirm = async (req, res) => {
  try {
    const result = await authService.confirm(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const result = await authService.signin(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const result = await authService.refresh(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};
