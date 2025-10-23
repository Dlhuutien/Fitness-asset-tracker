const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth APIs
router.post('/signup', authController.signup);
router.post('/confirm', authController.confirm);
router.post('/signin', authController.signin);
router.post('/refresh', authController.refresh);
router.post('/firstLogin', authController.firstLoginChangePassword);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/confirmForgotPassword", authController.confirmForgotPassword);

module.exports = router;
