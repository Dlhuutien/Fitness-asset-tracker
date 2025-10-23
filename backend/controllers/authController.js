const authService = require("../services/authService");

exports.signup = async (req, res) => {
  try {
    const result = await authService.signUp(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.confirm = async (req, res) => {
  try {
    const result = await authService.confirmSignUp(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const result = await authService.signIn(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const result = await authService.refreshToken(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.firstLoginChangePassword = async (req, res) => {
  try {
    const result = await authService.firstLoginChangePassword(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};

exports.confirmForgotPassword = async (req, res) => {
  try {
    const result = await authService.confirmForgotPassword(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.name, message: err.message });
  }
};
